import { NextResponse } from "next/server";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { appConfig } from "@/config/app.config";
import { queryKnowledgeGraph, classifyResults } from "@/lib/rag-pipeline";
import { computeAcademicGap } from "@/services/analyticalEngine";
import type { ModalData, PreferenceLogEntry } from "@/lib/constants";

import type { CareerResult, AcademicPathway } from "@/store/chat-store";
import type { RagQueryResult } from "@/lib/rag-pipeline";

const aiApiKey =
	process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";

const openrouter = createOpenAI({
	apiKey: aiApiKey,
	baseURL: appConfig.ai.baseURL,
});

/**
 * Build a CareerResult deterministically from RAG data + Analytical Engine.
 * No LLM dependency — this always produces a result as long as the DB has data.
 */
async function buildCareerResult(
	ragResult: RagQueryResult,
	riasec: { R: number; I: number; A: number; S: number; E: number; C: number },
	modalData: ModalData | null,
): Promise<CareerResult> {
	// Build academic pathways from RAG majors + analytical engine gap analysis
	const academicPathways: AcademicPathway[] = [];

	for (const major of ragResult.majors) {
		const gapResults = await computeAcademicGap(modalData, ragResult.careerId);

		// Group gap results by university for this major's universities
		const universities = major.universities.map((uni) => {
			const matchingGaps = gapResults.filter(
				(g) => g.universityName === uni.universityName,
			);

			return {
				name: uni.universityName,
				subjectsRequired: uni.subjectsRequired,
				tier: uni.universityTier || "university",
			};
		});

		// Build gap analysis text from analytical engine data
		const relevantGaps = gapResults.filter((g) =>
			major.universities.some((u) => u.universityName === g.universityName),
		);

		let gapAnalysis = "";
		if (relevantGaps.length > 0) {
			const passing = relevantGaps.filter((g) => g.pointGap <= 0 && g.pointGap !== -999);
			const needsWork = relevantGaps.filter((g) => g.pointGap > 0);
			const missing = relevantGaps.filter((g) => g.pointGap === -999);

			const parts: string[] = [];
			if (passing.length > 0) {
				parts.push(
					`Đạt yêu cầu ${passing.length}/${relevantGaps.length} tổ hợp`,
				);
			}
			if (needsWork.length > 0) {
				const avgGap =
					needsWork.reduce((sum, g) => sum + g.pointGap, 0) /
					needsWork.length;
				parts.push(
					`Cần tăng trung bình ${avgGap.toFixed(1)} điểm cho ${needsWork.length} tổ hợp`,
				);
			}
			if (missing.length > 0) {
				parts.push(
					`${missing.length} tổ hợp thiếu môn bắt buộc`,
				);
			}
			gapAnalysis = parts.join(". ") + ".";
		}

		academicPathways.push({
			targetMajor: major.majorName,
			universities,
			gapAnalysis,
		});
	}

	return {
		careerId: ragResult.careerId,
		careerTitle: ragResult.careerTitle,
		fitAnalysis: "", // Will be filled by LLM in a batch call
		academicPathways,
		backupOption: null, // Will be filled by LLM
		radarData: {
			userScores: riasec,
			careerVector: ragResult.careerVector,
		},
	};
}

/**
 * Use LLM to generate fitAnalysis text for all career results in one call.
 * This is a best-effort enhancement — if it fails, we use fallback text.
 */
async function generateFitAnalyses(
	careerResults: CareerResult[],
	riasec: { R: number; I: number; A: number; S: number; E: number; C: number },
	mbti: string | null,
): Promise<CareerResult[]> {
	if (!aiApiKey || careerResults.length === 0) return careerResults;

	try {
		const careerList = careerResults
			.map(
				(c, i) =>
					`${i + 1}. ${c.careerTitle} (Match: ${c.radarData ? Math.round(cosineSimilarity(Object.values(c.radarData.userScores), c.radarData.careerVector) * 100) : "?"}%)`,
			)
			.join("\n");

		const result = await generateText({
			model: openrouter.chat(appConfig.ai.model),
			prompt: `Bạn là chuyên gia tư vấn hướng nghiệp. Dựa trên hồ sơ RIASEC: R=${riasec.R}, I=${riasec.I}, A=${riasec.A}, S=${riasec.S}, E=${riasec.E}, C=${riasec.C}${mbti ? `, MBTI: ${mbti}` : ""}.

Viết phân tích ngắn gọn (tối đa 80 chữ mỗi ngành) giải thích TẠI SAO ngành này phù hợp với tính cách người dùng:
${careerList}

Trả về ĐÚNG FORMAT (mỗi dòng bắt đầu bằng số thứ tự):
1. [phân tích cho ngành 1]
2. [phân tích cho ngành 2]
3. [phân tích cho ngành 3]

KHÔNG markdown, KHÔNG giải thích thêm. Chỉ trả về các dòng phân tích.`,
		});

		const lines = result.text
			.split("\n")
			.filter((l) => /^\d+\./.test(l.trim()));

		return careerResults.map((career, i) => ({
			...career,
			fitAnalysis:
				lines[i]?.replace(/^\d+\.\s*/, "").trim() ||
				`Ngành ${career.careerTitle} phù hợp với hồ sơ tính cách và sở thích của bạn dựa trên phân tích RIASEC.`,
		}));
	} catch (error) {
		console.warn("Fit analysis generation failed (non-blocking):", error);
		// Fallback: use a generic but real description
		return careerResults.map((career) => ({
			...career,
			fitAnalysis: `Ngành ${career.careerTitle} phù hợp với hồ sơ tính cách và sở thích của bạn dựa trên phân tích RIASEC.`,
		}));
	}
}

/** Simple cosine similarity for two number arrays */
function cosineSimilarity(a: number[], b: number[]): number {
	let dot = 0,
		magA = 0,
		magB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		magA += a[i] * a[i];
		magB += b[i] * b[i];
	}
	const denom = Math.sqrt(magA) * Math.sqrt(magB);
	return denom === 0 ? 0 : dot / denom;
}

export async function POST(request: Request) {
	try {
		if (!aiApiKey) {
			return NextResponse.json(
				{
					error: "AI chưa được cấu hình. Hãy thêm OPENROUTER_API_KEY hoặc OPENAI_API_KEY vào app/.env.local.",
					primarySuggestions: [],
					reconsideredSuggestions: [],
				},
				{ status: 500 },
			);
		}

		const { riasec, mbti, modalData, preferencesLog } =
			(await request.json()) as {
				riasec: {
					R: number;
					I: number;
					A: number;
					S: number;
					E: number;
					C: number;
				};
				mbti: string | null;
				modalData: ModalData | null;
				preferencesLog: PreferenceLogEntry[];
			};

		if (!riasec) {
			return NextResponse.json(
				{ error: "RIASEC profile required" },
				{ status: 400 },
			);
		}

		// Step 1: Query Knowledge Graph (LIMIT 5)
		const ragResults = await queryKnowledgeGraph({ riasec, mbti });

		// Step 2: Classify into Primary vs Reconsidered
		const classified = classifyResults(ragResults, preferencesLog || []);

		// Step 3: Build CareerResult[] deterministically from RAG + Analytical Engine
		const allRagResults = [
			...classified.primarySuggestions,
			...classified.reconsideredSuggestions,
		];

		const careerResults: CareerResult[] = await Promise.all(
			allRagResults.map((rag) => buildCareerResult(rag, riasec, modalData)),
		);

		// Step 4: Use LLM to generate fitAnalysis text (best-effort, non-blocking)
		const enrichedResults = await generateFitAnalyses(
			careerResults,
			riasec,
			mbti,
		);

		// Step 5: Split back into primary and reconsidered
		const rejectedIds = new Set(
			(preferencesLog || [])
				.filter((e) => e.action === "reject_career")
				.map((e) => e.targetId),
		);

		let primaryResults = enrichedResults.filter(
			(c) => !rejectedIds.has(c.careerId),
		);
		const reconsideredResults = enrichedResults.filter((c) =>
			rejectedIds.has(c.careerId),
		);

		// FALLBACK: If DB is empty or returned no matches, generate careers directly via LLM
		if (primaryResults.length === 0 && aiApiKey) {
			try {
				const fallbackResult = await generateObject({
					model: openrouter.chat(appConfig.ai.model),
					schema: z.object({
						careers: z.array(z.object({
							title: z.string(),
							fitAnalysis: z.string()
						})).min(1).max(3)
					}),
					prompt: `Bạn là chuyên gia tư vấn hướng nghiệp. Dựa trên hồ sơ RIASEC: R=${riasec.R}, I=${riasec.I}, A=${riasec.A}, S=${riasec.S}, E=${riasec.E}, C=${riasec.C}${mbti ? `, MBTI: ${mbti}` : ""}.
Tạo 3 gợi ý nghề nghiệp phù hợp nhất cho người dùng.
Trả về mảng JSON với cấu trúc:
{ "careers": [{ "title": "Tên nghề", "fitAnalysis": "Giải thích ngắn gọn lý do phù hợp (dưới 80 chữ)" }] }`
				});

				primaryResults = fallbackResult.object.careers.map((c, i) => ({
					careerId: `fallback-${i}-${Date.now()}`,
					careerTitle: c.title,
					fitAnalysis: c.fitAnalysis,
					academicPathways: [],
					backupOption: null,
					radarData: {
						userScores: riasec,
						careerVector: [riasec.R, riasec.I, riasec.A, riasec.S, riasec.E, riasec.C]
					}
				}));
			} catch (fallbackError) {
				console.error("Fallback generation failed:", fallbackError);
			}
		}

		return NextResponse.json({
			primarySuggestions: primaryResults.slice(0, 3),
			reconsideredSuggestions: reconsideredResults,
		});
	} catch (error) {
		console.error("Recommend API error:", error);
		return NextResponse.json({
			primarySuggestions: [],
			reconsideredSuggestions: [],
			error: "Lỗi khi phân tích. Vui lòng thử lại.",
		});
	}
}
