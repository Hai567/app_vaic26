import { db } from "@/db/db";
import { majors, careers } from "@/db/schema";
import { sql } from "drizzle-orm";

export interface AggregatedUniversity {
	universityName: string;
	universityTier: string | null;
	subjectsRequired: { subjects: string; score: number }[];
}

export interface CareerMajorPathway {
	majorName: string;
	universities: AggregatedUniversity[];
}

export interface CareerMatch {
	careerId: string;
	careerTitle: string;
	careerDescription: string | null;
	careerVector: number[];
	similarity: number;
}

export const knowledgeGraphService = {
	async getCareersByRIASEC(
		userVector: number[],
		limit: number = 5,
	): Promise<CareerMatch[]> {
		if (!db) return [];

		const vectorStr = `[${userVector.join(",")}]`;

		const topCareers = await db.execute(sql`
			SELECT
				id, title, description, riasec_vector,
				1 - (riasec_vector <=> ${vectorStr}::vector) as similarity
			FROM careers
			ORDER BY riasec_vector <=> ${vectorStr}::vector
			LIMIT ${limit}
		`);

		return (topCareers as any[]).map((c) => {
			const vectorString = String(c.riasec_vector);
			const careerVector = vectorString
				.replace(/[\[\]]/g, "")
				.split(",")
				.map(Number);

			return {
				careerId: c.id,
				careerTitle: c.title,
				careerDescription: c.description,
				careerVector,
				similarity: Number(c.similarity),
			};
		});
	},

	async getAcademicPathwaysByCareer(
		careerId: string,
	): Promise<CareerMajorPathway[]> {
		if (!db) return [];

		const careerMajors = await db
			.select()
			.from(majors)
			.where(sql`${majors.careerId} = ${careerId}`);

		const pathways: CareerMajorPathway[] = [];

		for (const major of careerMajors) {
			const aggregated = await db.execute(sql`
				SELECT
					u.name as university_name,
					u.tier as university_tier,
					json_agg(json_build_object(
						'subjects', a.subjects_required,
						'score', a.score
					) ORDER BY a.score DESC) as subjects_required
				FROM admission_scores a
				INNER JOIN universities u ON a.university_id = u.id
				WHERE a.major_id = ${major.id}
				GROUP BY u.id, u.name, u.tier
				ORDER BY MAX(a.score) DESC
			`);

			pathways.push({
				majorName: major.name,
				universities: (aggregated as any[]).map((row) => ({
					universityName: row.university_name,
					universityTier: row.university_tier,
					subjectsRequired: row.subjects_required,
				})),
			});
		}

		return pathways;
	},
};
