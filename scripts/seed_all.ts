/**
 * Seed script — Populate the daFalcon knowledge graph from 4 CSV files.
 *
 * Run:  node --import tsx/esm scripts/seed_all.ts
 * Or:   npx tsx scripts/seed_all.ts    (if execution policy allows npx)
 *
 * CSV files expected at:  ../dataset/using/
 *   1. nganh_riasec_mbti.csv       → careers table
 *   2. after_school_edu_and_majors.csv → universities + majors + career↔major links
 *   3. nganh_nghe_and_salary.csv   → updates careers with salary_range (stored in description)
 *   4. cac_nhom_nganh_va_to_hop_xet_tuyen_chi_tiet.csv → admission_scores table
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { eq, sql } from "drizzle-orm";
import {
	careers,
	majors,
	universities,
	admissionScores,
} from "../src/db/schema";

// ─── Helpers ────────────────────────────────────────────────

const DATASET_DIR = path.join(process.cwd(), "..", "dataset", "using");

function readCsv(filename: string): Record<string, string>[] {
	const fullPath = path.join(DATASET_DIR, filename);
	if (!fs.existsSync(fullPath)) {
		throw new Error(`CSV not found: ${fullPath}`);
	}
	const content = fs.readFileSync(fullPath, "utf-8");
	return parse(content, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
		bom: true,
		relax_column_count: true,
	});
}

/** Convert 3-letter RIASEC code ("CEI") to 6D vector [R,I,A,S,E,C] */
function riasecCodeToVector(code: string): number[] {
	const vec = [0, 0, 0, 0, 0, 0];
	const map: Record<string, number> = {
		R: 0,
		I: 1,
		A: 2,
		S: 3,
		E: 4,
		C: 5,
	};
	// Weights: Primary=1.0, Secondary=0.7, Tertiary=0.4
	const weights = [1.0, 0.7, 0.4];
	for (let i = 0; i < Math.min(code.length, 3); i++) {
		const c = code[i].toUpperCase();
		if (c in map) vec[map[c]] = weights[i];
	}
	return vec;
}

/** Map university type from CSV to DB tier */
function mapTier(type: string): string {
	const t = type.toLowerCase().trim();
	if (t.includes("vocational") || t.includes("cao đẳng")) return "vocational";
	if (t.includes("academy") || t.includes("học viện")) return "academy";
	return "university";
}

/** Map location from CSV to display region */
function mapRegion(location: string): string {
	const loc = location.toLowerCase().trim();
	if (loc.includes("ha noi")) return "Hà Nội";
	if (loc.includes("hcm") || loc.includes("ho chi minh")) return "TP.HCM";
	if (loc.includes("da nang")) return "Đà Nẵng";
	if (loc.includes("can tho")) return "Cần Thơ";
	if (loc.includes("hai phong")) return "Hải Phòng";
	if (loc.includes("hue")) return "Huế";
	return location;
}

/**
 * Fuzzy-match a career title from the salary CSV to an existing career in DB.
 * The salary CSV has aggregated names like "Kế toán - Tài chính"
 * The career CSV has similar names like "Kế toán - Tài chính".
 */
function findCareerMatch(
	salaryTitle: string,
	careerTitles: string[],
): string | null {
	const normalized = salaryTitle.toLowerCase().trim();
	// Exact match first
	const exact = careerTitles.find(
		(t) => t.toLowerCase().trim() === normalized,
	);
	if (exact) return exact;
	// Partial match
	const partial = careerTitles.find(
		(t) =>
			normalized.includes(t.toLowerCase()) ||
			t.toLowerCase().includes(normalized),
	);
	return partial || null;
}

/**
 * Match a "nhóm ngành" from the admission CSV to a career in DB.
 * E.g. "Kế toán - Kiểm toán" should match career "Kế toán - Tài chính"
 */
const CAREER_NHOM_MAP: Record<string, string> = {
	"Kế toán - Kiểm toán": "Kế toán - Tài chính",
	"Tài chính - Ngân hàng - Bảo hiểm": "Kế toán - Tài chính",
	"Kinh tế - Quản trị kinh doanh - Thương Mại":
		"Kinh tế - Quản lý - Quy hoạch",
	"Báo chí - Marketing - Quảng cáo - PR": "Báo chí - Thư viện",
	"Y - Dược": "Y - Dược",
	"Thiết kế đồ họa - Game - Đa phương tiện": "Mỹ thuật - Thiết kế",
	"Xây dựng - Kiến trúc - Giao thông": "Xây dựng",
	"Du lịch-Khách sạn": "Du lịch - Khách sạn",
	"Điện lạnh - Điện tử - Điện - Tự động hóa": "Điện - Cơ điện tử",
	"Luật - Tòa án": "Luật - Tòa án",
	"Mỹ thuật - Âm nhạc - Nghệ thuật": "Văn hóa - Nghệ thuật",
	"Thời trang - May mặc": "Thời trang",
	"Thủy sản - Lâm Nghiệp - Nông nghiệp": "Thủy sản",
	"Toán học và thống kê": "Toán học - Thống kê",
	"Nhân sự - Hành chính": "Nhân sự",
	"Văn hóa - Chính trị - Khoa học Xã hội": "Văn hóa - Nghệ thuật",
	"Khoa học tự nhiên khác": "Khoa học tự nhiên",
};

// ─── Main ───────────────────────────────────────────────────

async function seed() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL not set in .env.local");
	}

	const client = postgres(connectionString, { prepare: false });
	const db = drizzle(client);

	console.log("🗑️  Clearing existing data...");
	await client`TRUNCATE admission_scores CASCADE`;
	await client`TRUNCATE majors CASCADE`;
	await client`TRUNCATE universities CASCADE`;
	await client`TRUNCATE careers CASCADE`;

	// Ensure pgvector extension
	await client`CREATE EXTENSION IF NOT EXISTS vector`;

	// ════════════════════════════════════════════════════════
	// STEP 1: Import careers from nganh_riasec_mbti.csv
	// ════════════════════════════════════════════════════════
	console.log("\n📦 Step 1: Importing careers...");
	const careerRows = readCsv("nganh_riasec_mbti.csv");
	const careerMap = new Map<string, string>(); // title → id

	for (const row of careerRows) {
		const id = String(row.id);
		const title = row.title;
		const description = row.description;
		const riasecCode = row.riasec_vector; // e.g. "CEI"
		const riasecVector = riasecCodeToVector(riasecCode);

		await db.insert(careers).values({
			id,
			title,
			description,
			riasecVector,
		});

		careerMap.set(title, id);
		console.log(
			`  ✅ Career: ${title} (RIASEC: ${riasecCode} → [${riasecVector.join(",")}])`,
		);
	}
	console.log(`  Total: ${careerMap.size} careers`);

	// ════════════════════════════════════════════════════════
	// STEP 2: Import universities + majors from after_school_edu_and_majors.csv
	// ════════════════════════════════════════════════════════
	console.log("\n🏫 Step 2: Importing universities & majors...");
	const eduRows = readCsv("after_school_edu_and_majors.csv");
	const uniMap = new Map<string, string>(); // name → id
	const majorMap = new Map<string, string>(); // "majorName|careerId" → id
	const allMajorNames = new Set<string>();

	for (const row of eduRows) {
		const uniName = row.name;
		const tier = mapTier(row.type);
		const region = mapRegion(row.location);

		// Insert university (dedup by name)
		if (!uniMap.has(uniName)) {
			const [inserted] = await db
				.insert(universities)
				.values({ name: uniName, region, tier })
				.returning({ id: universities.id });
			uniMap.set(uniName, inserted.id);
			console.log(`  🏫 University: ${uniName} (${tier}, ${region})`);
		}

		// Parse majors from comma-separated list
		const majorList = row.majors
			.split(",")
			.map((m: string) => m.trim())
			.filter(Boolean);

		for (const majorName of majorList) {
			allMajorNames.add(majorName.toLowerCase());

			// Try to find matching career for this major
			// Strategy: fuzzy match major name against career titles and smaller_areas
			let matchedCareerId: string | null = null;

			for (const careerRow of careerRows) {
				const smallerAreas = (careerRow.smaller_areas || "")
					.split(";")
					.map((s: string) => s.trim().toLowerCase());
				const careerTitleLower = careerRow.title.toLowerCase();

				if (
					majorName.toLowerCase().includes(careerTitleLower) ||
					careerTitleLower.includes(majorName.toLowerCase()) ||
					smallerAreas.some(
						(area: string) =>
							majorName.toLowerCase().includes(area) ||
							area.includes(majorName.toLowerCase()),
					)
				) {
					matchedCareerId = String(careerRow.id);
					break;
				}
			}

			// If no match, try keyword-based matching
			if (!matchedCareerId) {
				matchedCareerId = findCareerByKeyword(majorName, careerRows);
			}

			const key = `${majorName.toLowerCase()}|${matchedCareerId || "none"}`;
			if (!majorMap.has(key)) {
				const [inserted] = await db
					.insert(majors)
					.values({
						name: majorName,
						careerId: matchedCareerId,
					})
					.returning({ id: majors.id });
				majorMap.set(key, inserted.id);
			}
		}
	}
	console.log(
		`  Total: ${uniMap.size} universities, ${majorMap.size} majors`,
	);

	// ════════════════════════════════════════════════════════
	// STEP 3: Update careers with salary data from nganh_nghe_and_salary.csv
	// ════════════════════════════════════════════════════════
	console.log("\n💰 Step 3: Updating career salary info...");
	const salaryRows = readCsv("nganh_nghe_and_salary.csv");
	const careerTitles = Array.from(careerMap.keys());

	for (const row of salaryRows) {
		const salaryTitle = row.title?.trim();
		const salaryRange = row["salary range"]?.trim() || row[" salary range"]?.trim();
		if (!salaryTitle || !salaryRange) continue;

		const match = findCareerMatch(salaryTitle, careerTitles);
		if (match) {
			const careerId = careerMap.get(match)!;
			// Append salary to description
			await db
				.update(careers)
				.set({
					description: sql`${careers.description} || E'\n\nMức lương: ' || ${salaryRange}`,
				})
				.where(eq(careers.id, careerId));
			console.log(`  💰 ${match} ← ${salaryRange}`);
		} else {
			console.log(`  ⚠️  No match for salary: "${salaryTitle}"`);
		}
	}

	// ════════════════════════════════════════════════════════
	// STEP 4: Import admission combos from cac_nhom_nganh_va_to_hop_xet_tuyen_chi_tiet.csv
	// ════════════════════════════════════════════════════════
	console.log("\n📚 Step 4: Importing admission subject combos...");
	const admissionRows = readCsv(
		"cac_nhom_nganh_va_to_hop_xet_tuyen_chi_tiet.csv",
	);

	let admissionCount = 0;

	for (const row of admissionRows) {
		const nhomNganh =
			row["Nhóm ngành đào tạo"] || row["nhom_nganh"] || "";
		const combosRaw =
			row["Tất cả các tổ hợp xét tuyển"] || row["to_hop"] || "";

		if (!nhomNganh || !combosRaw) continue;

		// Map nhóm ngành to career
		const careerTitle = CAREER_NHOM_MAP[nhomNganh.trim()];
		if (!careerTitle) {
			console.log(`  ⚠️  No career mapping for nhóm ngành: "${nhomNganh}"`);
			continue;
		}

		const careerId = careerMap.get(careerTitle);
		if (!careerId) {
			console.log(
				`  ⚠️  Career not in DB: "${careerTitle}" (from "${nhomNganh}")`,
			);
			continue;
		}

		// Parse all subject combinations: "A00: Toán, Vật lí, Hóa học | D01: ..."
		const combos = combosRaw.split("|").map((c: string) => c.trim());

		// Find all majors linked to this career
		const careerMajorIds: string[] = [];
		for (const [key, id] of majorMap.entries()) {
			if (key.endsWith(`|${careerId}`)) {
				careerMajorIds.push(id);
			}
		}

		if (careerMajorIds.length === 0) {
			console.log(
				`  ⚠️  No majors found for career "${careerTitle}", skipping combos`,
			);
			continue;
		}

		// Find all universities that have these majors
		const uniIds = Array.from(uniMap.values());

		// Create admission scores: for each major + university pair, add subject combos
		// We'll use the first 3 most common combos to avoid explosion
		const topCombos = combos.slice(0, 5);

		for (const combo of topCombos) {
			// Parse "A00: Toán, Vật lí, Hóa học"
			const colonIdx = combo.indexOf(":");
			if (colonIdx === -1) continue;

			const subjects = combo
				.substring(colonIdx + 1)
				.trim();

			if (!subjects) continue;

			// For each major of this career, link to a subset of universities
			for (const majorId of careerMajorIds.slice(0, 3)) {
				// Link to first few universities
				for (const uniId of uniIds.slice(0, 5)) {
					await db.insert(admissionScores).values({
						majorId,
						universityId: uniId,
						subjectsRequired: subjects,
						year: 2025,
						score: 20 + Math.random() * 8, // Placeholder score 20-28
					});
					admissionCount++;
				}
			}
		}

		console.log(
			`  📚 ${nhomNganh} → ${careerTitle}: ${topCombos.length} combos × ${Math.min(careerMajorIds.length, 3)} majors`,
		);
	}

	console.log(`  Total: ${admissionCount} admission score records`);

	// ════════════════════════════════════════════════════════
	// Summary
	// ════════════════════════════════════════════════════════
	console.log("\n" + "═".repeat(50));
	console.log("✅ Seed complete!");
	console.log(`   📊 ${careerMap.size} careers`);
	console.log(`   🏫 ${uniMap.size} universities`);
	console.log(`   📖 ${majorMap.size} majors`);
	console.log(`   📚 ${admissionCount} admission scores`);
	console.log("═".repeat(50));

	await client.end();
}

/** Keyword-based fallback matching for major → career */
function findCareerByKeyword(
	majorName: string,
	careerRows: Record<string, string>[],
): string | null {
	const m = majorName.toLowerCase();
	const keywordMap: [string[], string][] = [
		[["kế toán", "kiểm toán", "tài chính", "ngân hàng", "bảo hiểm"], "1"],
		[["kinh tế", "quản trị", "kinh doanh", "marketing", "thương mại"], "2"],
		[["báo chí", "truyền thông", "quan hệ công chúng", "xuất bản", "pr", "thư viện"], "3"],
		[["y khoa", "dược", "điều dưỡng", "răng", "y học", "y tế", "xét nghiệm", "hình ảnh y"], "4"],
		[["điện", "cơ điện", "robot", "tự động", "viễn thông", "điện tử"], "5"],
		[["xây dựng", "kiến trúc", "giao thông", "thủy lợi", "nội thất"], "6"],
		[["luật", "pháp luật"], "7"],
		[["du lịch", "khách sạn", "lữ hành", "nhà hàng", "ẩm thực"], "8"],
		[["mỹ thuật", "thiết kế", "đồ họa", "hội họa", "game", "đa phương tiện"], "9"],
		[["thời trang", "may mặc"], "10"],
		[["thủy sản", "nông nghiệp", "lâm nghiệp", "trồng trọt", "chăn nuôi"], "11"],
		[["nhân sự", "nhân lực", "hành chính"], "12"],
		[["toán", "thống kê", "tin học"], "13"],
		[["vật lý", "hóa học", "sinh học", "khoa học"], "14"],
		[["văn hóa", "nghệ thuật", "âm nhạc", "sân khấu", "điện ảnh"], "15"],
		[["chăm sóc", "phục hồi", "vật lý trị liệu", "dinh dưỡng", "hộ sinh"], "16"],
	];

	for (const [keywords, id] of keywordMap) {
		if (keywords.some((kw) => m.includes(kw))) {
			return id;
		}
	}
	return null;
}

seed().catch((err) => {
	console.error("❌ Seed failed:", err);
	process.exit(1);
});
