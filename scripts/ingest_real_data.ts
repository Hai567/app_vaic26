import { db } from "@/db/db";
import { careers, majors, universities, admissionScores } from "@/db/schema";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Helper to convert RIASEC 3-letter string to 6D vector [R, I, A, S, E, C]
function riasecStringToVector(code: string): number[] {
	const vec = [0, 0, 0, 0, 0, 0];
	const map = { R: 0, I: 1, A: 2, S: 3, E: 4, C: 5 };
	
	// Weights: Primary = 3, Secondary = 2, Tertiary = 1
	const weights = [3, 2, 1];
	
	for (let i = 0; i < Math.min(code.length, 3); i++) {
		const char = code[i].toUpperCase() as keyof typeof map;
		if (map[char] !== undefined) {
			vec[map[char]] = weights[i];
		}
	}
	return vec;
}

async function ingest() {
	console.log("Starting real data ingestion...");
	
	const careersCsvPath = path.join(process.cwd(), "..", "dataset", "using", "nganh_riasec_mbti.csv");
	if (!fs.existsSync(careersCsvPath)) {
		console.warn(`Could not find CSV at ${careersCsvPath}. Please ensure the dataset exists.`);
		return;
	}

	const fileContent = fs.readFileSync(careersCsvPath, "utf-8");
	const records = parse(fileContent, {
		columns: true,
		skip_empty_lines: true,
	});

	if (!db) {
		console.error("Database connection not established");
		return;
	}

	await db.transaction(async (tx) => {
		for (const record of records as any[]) {
			const id = String(record.id);
			const title = String(record.title);
			const description = String(record.description);
			const riasecStr = String(record.riasec_vector);
			const riasecVector = riasecStringToVector(riasecStr);

			await tx.insert(careers).values({
				id,
				title,
				description,
				riasecVector,
			}).onConflictDoUpdate({
				target: careers.id,
				set: {
					title,
					description,
					riasecVector,
				}
			});
			console.log(`Ingested career: ${title}`);
			
			// We can also extract "smaller_areas" to majors later if needed.
		}
	});

	console.log("Ingestion complete!");
}

ingest().catch(console.error);
