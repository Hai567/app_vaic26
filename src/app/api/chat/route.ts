import { NextResponse } from "next/server";
import { generateText, generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { appConfig } from "@/config/app.config";
import { db } from "@/db/db";
import { educationGuidelines, users } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import type { ModalData, AiExtractedData } from "@/lib/constants";
import { buildKnowledgeContext } from "@/services/knowledgeGraph";

const aiApiKey =
	process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";

const openrouter = createOpenAI({
	apiKey: aiApiKey,
	baseURL: appConfig.ai.baseURL,
});

function missingAiKeyResponse() {
	return NextResponse.json(
		{
			message:
				"AI chưa được cấu hình. Hãy thêm OPENROUTER_API_KEY hoặc OPENAI_API_KEY vào app/.env.local rồi khởi động lại ứng dụng.",
			isProfileComplete: false,
			error: true,
		},
		{ status: 500 },
	);
}

/** Schema for the structured extraction pass */
const extractionSchema = z.object({
	hasNewData: z
		.boolean()
		.describe(
			"True if the user revealed ANY new personal data in their latest messages",
		),
	certificates: z
		.array(z.string())
		.optional()
		.describe("New certificates, awards, or achievements mentioned"),
	careerOrientation: z
		.string()
		.optional()
		.describe("Career direction or goal if mentioned"),
	hobbies: z
		.array(z.string())
		.optional()
		.describe("Hobbies or interests if mentioned"),
	mbti: z
		.string()
		.optional()
		.describe("MBTI type if mentioned (e.g. INTJ, ENFP)"),
	riasec: z
		.object({
			R: z.number(),
			I: z.number(),
			A: z.number(),
			S: z.number(),
			E: z.number(),
			C: z.number(),
		})
		.optional()
		.describe("RIASEC scores if inferable from the conversation"),
});

/** Intent Router: Classify user message into Route A (Probing) or Route B (Information Seeking) */
async function classifyIntent(
	userMessage: string,
): Promise<"probing" | "information_seeking"> {
	const infoSeekingKeywords = [
		"quy",
		"tuyển",
		"điểm chuẩn",
		"đại học",
		"cao đẳng",
		"yêu cầu",
		"ngành",
		"combination",
		"đạt",
		"thế nào",
		"học",
		"trường",
		"admission",
		"gpa",
		"score",
	];

	const lowerMessage = userMessage.toLowerCase();
	const hasInfoSeekingKeyword = infoSeekingKeywords.some((kw) =>
		lowerMessage.includes(kw),
	);

	if (
		hasInfoSeekingKeyword ||
		userMessage.includes("?") ||
		userMessage.includes("à") ||
		userMessage.includes("sao")
	) {
		return "information_seeking";
	}

	return "probing";
}

/** Route B: Query education_guidelines table for relevant context */
async function queryEducationGuidelines(userQuery: string): Promise<string> {
	if (!db) return "";
	try {
		const results = await db
			.select()
			.from(educationGuidelines)
			.where(
				sql`${educationGuidelines.content} ILIKE ${"%" + userQuery.toLowerCase() + "%"}`,
			)
			.limit(3);

		if (results.length === 0) return "";

		return results
			.map((r) => `[GDPT 2018 CONTEXT: ${r.topic}]\n${r.content}`)
			.join("\n\n");
	} catch (error) {
		console.warn("Education guidelines query error:", error);
		return "";
	}
}

export async function POST(request: Request) {
	try {
		const { messages, probingStep, modalData } = await request.json();

		if (!messages || !Array.isArray(messages)) {
			return NextResponse.json(
				{ error: "No messages provided" },
				{ status: 400 },
			);
		}

		// Auth to get userId for DB tool updates
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		const latestUserMessage =
			messages
				.slice()
				.reverse()
				.find((m: { role: string }) => m.role === "user")?.content ||
			"";

		const intent = await classifyIntent(latestUserMessage);

		// Fetch current AI extracted data to inject state
		let aiExtractedData: AiExtractedData | null = null;
		let isReturningUser = false;
		if (user && db) {
			const [dbUser] = await db
				.select()
				.from(users)
				.where(eq(users.authId, user.id))
				.limit(1);

			if (dbUser) {
				aiExtractedData = dbUser.aiExtractedData as AiExtractedData;
				// If they already have some extracted data (e.g. mbti/riasec), consider them returning
				isReturningUser =
					!!aiExtractedData?.riasec || !!aiExtractedData?.mbti;
			}
		}

		// Build the dynamic system prompt
		let systemContent = `Bạn là daFalcon — trợ lý tư vấn hướng nghiệp AI thân thiện, gần gũi dành cho học sinh Việt Nam.
Mục tiêu của bạn là thấu hiểu người dùng để đưa ra gợi ý nghề nghiệp chính xác nhất.

--- TRẠNG THÁI HIỆN TẠI ---
IS_RETURNING_USER: ${isReturningUser}
MODAL_DATA: ${JSON.stringify(modalData || {})}
AI_EXTRACTED_DATA: ${JSON.stringify(aiExtractedData || {})}

--- QUY TẮC HOẠT ĐỘNG (BẮT BUỘC TUÂN THỦ) ---
1. Xưng hô TUYỆT ĐỐI: BẮT BUỘC xưng là "mình" và gọi người dùng là "bạn" trong toàn bộ cuộc hội thoại. Tuyệt đối KHÔNG xưng "tôi", "em" hay gọi "anh", "chị", "em".
2. Duy trì ngữ cảnh (Context Linkage):
   - LUÔN LUÔN dựa vào lịch sử trò chuyện và câu trả lời trước đó của người dùng để dẫn dắt câu hỏi tiếp theo. 
   - Ví dụ: Nếu người dùng nói thích vẽ, câu hỏi tiếp theo phải liên quan đến việc vẽ thay vì hỏi một câu không liên quan.
   - Hãy sử dụng AI_EXTRACTED_DATA để nhắc lại những gì người dùng đã chia sẻ.
3. State Awareness:
   - Nếu IS_RETURNING_USER là true: Chào mừng họ quay lại, tóm tắt AI_EXTRACTED_DATA hiện tại và hỏi: "Bạn có muốn cập nhật thêm chứng chỉ mới, hay có thay đổi định hướng nào không?"
   - Nếu IS_RETURNING_USER là false: Chào mừng họ, ghi nhận thông tin từ MODAL_DATA, và bắt đầu thu thập dữ liệu (Extraction Flow).
4. Extraction Flow & Transitions:
   Thu thập lần lượt: Các chứng chỉ/giải thưởng -> Định hướng nghề nghiệp -> Sở thích -> Tính cách (thông qua câu hỏi tình huống).
5. Smooth Transitions:
   Mỗi khi chuyển sang chủ đề mới, tạo sự liên kết mượt mà. (Ví dụ: "Thật tuyệt! Với sở thích đó, mình muốn hỏi thêm một chút về thói quen của bạn nhé...")
6. Implicit Saving:
   Hệ thống TỰ ĐỘNG lưu thông tin. BẠN KHÔNG CẦN thông báo việc lưu dữ liệu, cứ trò chuyện tự nhiên.
7. Điều kiện kết thúc:
   Khi bạn đã có đủ dữ liệu, hãy kết luận bằng một câu có chứa từ "đã đủ thông tin" hoặc "đã hiểu rõ" để hệ thống tự động phân tích kết quả.
`;

		// Inject RAG context if information seeking
		if (intent === "information_seeking") {
			const ragContext =
				await queryEducationGuidelines(latestUserMessage);
			if (ragContext) {
				systemContent += `\n\n[DÙNG THÔNG TIN GDPT 2018 DỰA TRÊN DỮ LIỆU SAU ĐỂ TRẢ LỜI CÂU HỎI]\n${ragContext}`;
			} else {
				systemContent +=
					"\n\nBạn là cố vấn giáo dục về GDPT 2018 và quy tuyển đại học Việt Nam. Trả lời dựa trên kiến thức của bạn.";
			}
		}

		// Inject knowledge graph context (careers, majors, universities, salary)
		// Derive user's top RIASEC codes from extracted data
		let userRiasecCodes: string[] | null = null;
		let userMbti: string | null = null;
		if (aiExtractedData?.riasec) {
			const r = aiExtractedData.riasec;
			// Sort by score descending, take top 3 codes
			const sorted = Object.entries(r)
				.sort(([, a], [, b]) => (b as number) - (a as number))
				.slice(0, 3)
				.map(([code]) => code);
			userRiasecCodes = sorted;
		}
		if (aiExtractedData?.mbti) {
			userMbti = aiExtractedData.mbti;
		}
		const knowledgeCtx = buildKnowledgeContext(userRiasecCodes, userMbti);
		systemContent += `\n\n${knowledgeCtx}\n\n[QUY TẬc SỬ DỤNG KNOWLEDGE GRAPH]\nCHỈ sử dụng dữ liệu từ KNOWLEDGE GRAPH ở trên để trả lời câu hỏi về ngành nghề, mức lương, trường đại học, tổ hợp xét tuyển. KHÔNG ĐƯỢC bịa ra số liệu hoặc tên trường không có trong dữ liệu này.`;

		// Convert frontend messages to AI SDK format
		const coreMessages = messages.map((m: any) => ({
			role: m.role,
			content: m.content,
		}));

		if (!aiApiKey) {
			return missingAiKeyResponse();
		}

		// === PASS 1: Conversational Response (no tools) ===
		const result = await generateText({
			model: openrouter.chat(appConfig.ai.model),
			system: systemContent,
			messages: coreMessages,
		});

		const content = result.text || "";

		// === PASS 2: Structured Data Extraction (deterministic, server-side) ===
		// Only run extraction if we have a logged-in user and a DB connection
		// Track the latest merged data to return to the client
		let latestExtractedData: AiExtractedData | null = aiExtractedData;
		if (user && db) {
			try {
				// Build a focused extraction prompt from the last few messages
				const recentMessages = coreMessages.slice(-6); // last 3 exchanges
				const extractionResult = await generateObject({
					model: openrouter.chat(appConfig.ai.model),
					schema: extractionSchema,
					prompt: `Analyze the following conversation between an AI career counselor and a Vietnamese student.
Extract any NEW personal data the student revealed. Only extract data that is explicitly stated, never infer or guess.
If no new data was revealed, set hasNewData to false.

Conversation:
${recentMessages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}

AI's latest response:
assistant: ${content}`,
				});

				const extracted = extractionResult.object;

				// Only write to DB if new data was actually found
				if (extracted.hasNewData) {
					const [dbUser] = await db
						.select()
						.from(users)
						.where(eq(users.authId, user.id))
						.limit(1);

					if (dbUser) {
						const currentAiData =
							(dbUser.aiExtractedData as AiExtractedData) || {
								certificates: [],
								careerOrientation: null,
								hobbies: [],
								mbti: null,
								riasec: null,
							};

						// Merge: append arrays, overwrite scalars only if new value exists
						const mergedCerts = [
							...new Set([
								...(currentAiData.certificates || []),
								...(extracted.certificates || []),
							]),
						];
						const mergedHobbies = [
							...new Set([
								...(currentAiData.hobbies || []),
								...(extracted.hobbies || []),
							]),
						];

						const mergedData: AiExtractedData = {
							certificates: mergedCerts,
							careerOrientation:
								extracted.careerOrientation ||
								currentAiData.careerOrientation,
							hobbies: mergedHobbies,
							mbti: extracted.mbti || currentAiData.mbti,
							riasec: extracted.riasec || currentAiData.riasec,
						};

						await db
							.update(users)
							.set({ aiExtractedData: mergedData })
							.where(eq(users.authId, user.id));

						// Update tracker so we return fresh data to client
						latestExtractedData = mergedData;
					}
				}
			} catch (extractionError) {
				// Extraction failure must not block the chat response
				console.warn(
					"Profile extraction failed (non-blocking):",
					extractionError,
				);
			}
		}

		const isProfileComplete =
			content.includes("đã hiểu rõ") ||
			content.includes("phân tích và tư vấn") ||
			content.includes("đã đủ thông tin");

		return NextResponse.json({
			message: content,
			isProfileComplete,
			intent,
			extractedData: latestExtractedData,
		});
	} catch (error) {
		console.error("Chat API error:", error);
		return NextResponse.json(
			{
				message:
					"Xin lỗi, mình gặp lỗi kết nối. Bạn thử gửi lại tin nhắn nhé!",
				isProfileComplete: false,
				error: true,
			},
			{ status: 200 },
		);
	}
}
