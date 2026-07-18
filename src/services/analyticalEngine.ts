import { db } from "@/db/db";
import { careers, admissionScores, majors, universities, users } from "@/db/schema";
import { sql, eq, cosineDistance, desc } from "drizzle-orm";
import type { ModalData } from "@/lib/constants";

export interface AcademicPathwayResult {
	universityName: string;
	requiredCombo: string;
	historicalScore: number;
	userCalculatedScore: number;
	pointGap: number;
}

export async function calculateVectorFit(userRiasec: number[], limit = 3) {
	if (!db) return [];
	// Calculate similarity = 1 - cosine_distance
	// userRiasec is [R, I, A, S, E, C]
	const similarity = sql<number>`1 - (${cosineDistance(
		careers.riasecVector,
		userRiasec
	)})`;

	const results = await db
		.select({
			id: careers.id,
			title: careers.title,
			description: careers.description,
			similarity,
		})
		.from(careers)
		.orderBy((t) => desc(t.similarity))
		.limit(limit);

	return results.map((r) => ({
		...r,
		similarityPercentage: Math.round(r.similarity * 100),
	}));
}

export async function computeAcademicGap(
	modalData: ModalData | null,
	targetCareerId: string
): Promise<AcademicPathwayResult[]> {
	if (!db) return [];
	if (!modalData) return [];

	// Helper to calculate total score for a combo (e.g., "Toán,Vật lý,Hóa học")
	const calculateScoreForCombo = (comboStr: string): number | null => {
		const subjects = comboStr.split(",").map((s) => s.trim());
		let total = 0;
		for (const subject of subjects) {
			let found = false;
			// check mandatory subjects
			if (modalData.mandatorySubjects) {
				for (const m of modalData.mandatorySubjects) {
					if (m.name === subject || (m.name === "Toán" && subject.includes("Toán")) || (m.name === "Ngữ văn" && subject.includes("văn")) || (m.name === "Ngoại ngữ" && subject.includes("Anh"))) {
						total += (m.score || 0);
						found = true;
						break;
					}
				}
			}
			// check elective subjects
			if (!found && modalData.electiveSubjects) {
				for (const elective of modalData.electiveSubjects) {
					if (elective.name === subject || elective.name.includes(subject)) {
						total += (elective.score || 0);
						found = true;
						break;
					}
				}
			}
			if (!found) return null; // Missing subject
		}
		return total;
	};

	// Query pathways
	const pathways = await db
		.select({
			universityName: universities.name,
			requiredCombo: admissionScores.subjectsRequired,
			historicalScore: admissionScores.score,
		})
		.from(admissionScores)
		.innerJoin(majors, eq(admissionScores.majorId, majors.id))
		.innerJoin(universities, eq(admissionScores.universityId, universities.id))
		.where(eq(majors.careerId, targetCareerId));

	const results: AcademicPathwayResult[] = [];

	for (const p of pathways) {
		const calculatedScore = calculateScoreForCombo(p.requiredCombo);
		// If calculatedScore is null, they don't have the subjects for it, skip or we could include with gap = Infinity
		if (calculatedScore !== null) {
			results.push({
				universityName: p.universityName,
				requiredCombo: p.requiredCombo,
				historicalScore: p.historicalScore,
				userCalculatedScore: Number(calculatedScore.toFixed(2)),
				pointGap: Number((p.historicalScore - calculatedScore).toFixed(2)),
			});
		} else {
			// We can also include pathways they don't have subjects for, marking gap as special
			results.push({
				universityName: p.universityName,
				requiredCombo: p.requiredCombo,
				historicalScore: p.historicalScore,
				userCalculatedScore: 0,
				pointGap: -999, // Magic number indicating missing subject
			});
		}
	}

	return results;
}
