import { knowledgeGraphService } from "@/lib/knowledgeGraphService";
import type { PreferenceLogEntry } from "@/lib/constants";

interface RagInput {
	riasec: {
		R: number;
		I: number;
		A: number;
		S: number;
		E: number;
		C: number;
	};
	mbti: string | null;
}

/** University with aggregated subject requirements per GDPT 2018 */
interface AggregatedUniversity {
	universityName: string;
	universityTier: string | null;
	subjectsRequired: { subjects: string; score: number }[];
}

export interface RagQueryResult {
	careerId: string;
	careerTitle: string;
	careerDescription: string | null;
	careerVector: number[];
	similarity: number;
	majors: {
		majorName: string;
		universities: AggregatedUniversity[];
	}[];
}

export interface ClassifiedResults {
	primarySuggestions: RagQueryResult[];
	reconsideredSuggestions: RagQueryResult[];
}

/**
 * Query the pseudo-Knowledge Graph:
 * 1. Cosine similarity on careers.riasec_vector (LIMIT 5)
 * 2. Join majors -> admission_scores -> universities
 * 3. GROUP BY majorId + universityId, aggregate subject blocks via json_agg
 */
export async function queryKnowledgeGraph(
	input: RagInput,
): Promise<RagQueryResult[]> {
	try {
		const userVector = [
			input.riasec.R,
			input.riasec.I,
			input.riasec.A,
			input.riasec.S,
			input.riasec.E,
			input.riasec.C,
		];

		// Fetch careers via vector similarity (LIMIT 5)
		const topCareers = await knowledgeGraphService.getCareersByRIASEC(userVector, 5);
		const results: RagQueryResult[] = [];

		for (const career of topCareers) {
			// Fetch academic pathways (majors, universities, admission scores)
			const majorsData = await knowledgeGraphService.getAcademicPathwaysByCareer(career.careerId);

			results.push({
				careerId: career.careerId,
				careerTitle: career.careerTitle,
				careerDescription: career.careerDescription,
				careerVector: career.careerVector,
				similarity: career.similarity,
				majors: majorsData,
			});
		}

		return results;
	} catch (error) {
		console.error("RAG query error:", error);
		return [];
	}
}


/**
 * Classify RAG results into Primary vs Reconsidered per instruct3 Phase 2.
 * - Primary: Top 2-3 careers that have NEVER been rejected
 * - Reconsidered: Careers with high match but previously rejected
 */
export function classifyResults(
	ragResults: RagQueryResult[],
	preferencesLog: PreferenceLogEntry[],
): ClassifiedResults {
	const rejectedIds = new Set(
		preferencesLog
			.filter((e) => e.action === "reject_career")
			.map((e) => e.targetId),
	);

	const primary: RagQueryResult[] = [];
	const reconsidered: RagQueryResult[] = [];

	for (const result of ragResults) {
		if (rejectedIds.has(result.careerId)) {
			reconsidered.push(result);
		} else if (primary.length < 3) {
			primary.push(result);
		}
		// Skip non-rejected careers beyond the top 3
	}

	return {
		primarySuggestions: primary,
		reconsideredSuggestions: reconsidered,
	};
}

/**
 * Build the LLM context payload from classified RAG results.
 */
export function buildRagContext(
	classified: ClassifiedResults,
	softData: { riasec: RagInput["riasec"]; mbti: string | null },
	hardDataStr: string,
	evolutionLogStr: string,
): string {
	return `DỮ LIỆU ĐẦU VÀO:
- Hard Data Học sinh: ${hardDataStr}
- Soft Data (Tính cách/RIASEC/MBTI): RIASEC: R=${softData.riasec.R}, I=${softData.riasec.I}, A=${softData.riasec.A}, S=${softData.riasec.S}, E=${softData.riasec.E}, C=${softData.riasec.C}${softData.mbti ? `, MBTI: ${softData.mbti}` : ""}
- Lịch sử thay đổi (Preferences Log): ${evolutionLogStr}
- RAG Dữ liệu Gợi ý chính: ${JSON.stringify(classified.primarySuggestions, null, 2)}
- RAG Dữ liệu Xem xét lại: ${JSON.stringify(classified.reconsideredSuggestions, null, 2)}`;
}

/**
 * GDPT 2018: Map user's selected subjects to university admission requirements.
 * Returns gap analysis showing which university combinations align with user's subjects.
 */
export function mapGdpt2018SubjectsToUniversities(
	userMandatory: string[],
	userElectives: string[],
	ragResults: RagQueryResult[],
): RagQueryResult[] {
	const userSubjects = new Set([...userMandatory, ...userElectives]);

	return ragResults.map((career) => ({
		...career,
		majors: career.majors.map((major) => ({
			...major,
			universities: major.universities.map((uni) => ({
				...uni,
				// Filter/score subject requirements based on user's GDPT 2018 selection
				subjectsRequired: uni.subjectsRequired
					.map((req: { subjects: string; score: number }) => {
						const requiredSubjects = req.subjects
							.split(",")
							.map((s: string) => s.trim());
						// Calculate how many user's subjects overlap with requirement
						const matchCount = requiredSubjects.filter(
							(s: string) => userSubjects.has(s),
						).length;
						const matchPercentage =
							(matchCount / requiredSubjects.length) * 100;
						return {
							...req,
							gdpt2018MatchPercentage: matchPercentage,
						};
					})
					.sort(
						(a: any, b: any) =>
							b.gdpt2018MatchPercentage -
							a.gdpt2018MatchPercentage,
					),
			})),
		})),
	}));
}


