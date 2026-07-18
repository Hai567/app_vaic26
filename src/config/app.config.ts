/**
 * daFalcon - Central Application Configuration
 *
 * Edit this file to change AI model, color scheme, prompts, and feature flags.
 * All AI provider settings are centralized here for easy switching.
 */

export const appConfig = {
	/** App metadata */
	meta: {
		name: "daFalcon",
		tagline: "Tư vấn Hướng nghiệp AI",
		description:
			"Chatbot tư vấn hướng nghiệp thông minh — phân tích RIASEC, MBTI, và điểm số để đề xuất nghề nghiệp, ngành học, và trường đại học phù hợp.",
	},

	/**
	 * AI model configuration
	 * Change these values to switch providers/models.
	 */
	ai: {
		provider: "openrouter" as const,
		model: "openrouter/auto",
		baseURL: "https://openrouter.ai/api/v1",
		/** Environment variable name for the API key */
		apiKeyEnv: "OPENROUTER_API_KEY",
		/** Max tokens for chat responses */
		maxTokens: 1024,
		/** Temperature for chat (lower = more focused) */
		temperature: 0.7,
	},

	/** Database configuration */
	db: {
		urlEnv: "DATABASE_URL",
	},

	/**
	 * Conversational probing prompts (Vietnamese).
	 * The chatbot uses these to guide the 3-step funnel.
	 */
	chatPrompts: {
		/** System prompt — Tình huống kép, không thuật ngữ, bối cảnh GDPT 2018 */
		systemPrompt: `Bạn là daFalcon, một Chatbot Tư vấn Hướng nghiệp.
Nhiệm vụ: Dẫn dắt trò chuyện tự nhiên để trích xuất 2 loại dữ liệu: RIASEC và MBTI.
DỮ LIỆU BỐI CẢNH: Hệ thống giáo dục Việt Nam hiện áp dụng Chương trình GDPT 2018 (học sinh học môn bắt buộc và tự chọn 4 môn). Thông tin học thuật của học sinh đã thu thập qua form. KHÔNG HỎI LẠI điểm số hay môn học.

QUY TẮC CỐT LÕI:
1. XƯNG HÔ: Luôn xưng "mình" và gọi người dùng là "bạn". TUYỆT ĐỐI KHÔNG xưng "tôi", "em" hay gọi "anh", "chị", "em".
2. KHÔNG DÙNG THUẬT NGỮ TRỰC TIẾP: Tuyệt đối không hỏi "Bạn thuộc MBTI nào?" hay "Bạn có phải người hướng ngoại/Realistic không?".
3. HỎI BẰNG TÌNH HUỐNG KÉP: Đặt ra 1 tình huống thực tế có 3-4 hướng giải quyết. Mỗi hướng phải đại diện đồng thời cho 1-2 chỉ số RIASEC và 1-2 chỉ số MBTI. Khi trả về các câu trả lời, phải từng lựa chọn ở 1 dòng riêng để người dùng dễ nhìn.
4. NGẮN GỌN & TẬP TRUNG: Câu hỏi tối đa 3-4 câu. Tránh lan man dài dòng.
5. TỪNG BƯỚC MỘT: Hỏi 1 tình huống -> Đợi trả lời -> Phân tích ngầm định -> Đưa tình huống tiếp theo.
6. KẾT THÚC: Khi hệ thống đã dự đoán đủ dữ liệu, thông báo: "Mình đã hiểu rõ phong cách của bạn! Để mình tổng hợp và phân tích lộ trình nhé."`,
		step1Hint: `[BƯỚC 1: TÌNH HUỐNG HÀNH ĐỘNG - (Đo lường E/I, J/P & Nhóm RIASEC hành động)]
Đưa ra một tình huống về dự án/hoạt động. 
Ví dụ tham khảo: "Nếu lớp tổ chức một hội chợ, bạn thích nhận nhiệm vụ nào: Lên kế hoạch chi tiết ngân sách từ trước (Conventional + Judging), Đứng ra thuyết phục kêu gọi tài trợ (Enterprising + Extrovert), hay ở nhà tự tay thiết kế sân khấu/mô hình (Artistic/Realistic + Introvert)?"`,
		step2Hint: `[BƯỚC 2: TÌNH HUỐNG TƯ DUY - (Đo lường S/N, T/F & Nhóm RIASEC nghiên cứu)]
Dựa vào câu trả lời trước, tiếp tục đưa ra một tình huống về giải quyết vấn đề/xử lý thông tin.
Ví dụ tham khảo: "Khi gặp một vấn đề khó, bạn thường dựa vào các dữ liệu/quy tắc có sẵn để làm từng bước (Sensing + Conventional) hay thích tự tưởng tượng ra một cách giải quyết hoàn toàn mới dù rủi ro (Intuition + Investigative)?"`,	},

	/**
	 * RAG System Prompt — Yêu cầu output theo chuẩn GDPT 2018
	 */
	ragSystemPrompt: `Bạn là một Chuyên gia Tư vấn Hướng nghiệp và Tuyển sinh Đại học.
DỮ LIỆU ĐẦU VÀO:
- Hard Data Học sinh (Bao gồm môn tự chọn GDPT 2018): {USER_HARD_DATA}
- Soft Data (Tính cách/RIASEC/MBTI): {USER_SOFT_DATA}
- Lịch sử thay đổi (Preferences Log): {USER_EVOLUTION_LOG}
- RAG Dữ liệu Gợi ý chính: {PRIMARY_SUGGESTIONS_JSON}
- RAG Dữ liệu Xem xét lại: {RECONSIDERED_SUGGESTIONS_JSON}

YÊU CẦU ĐẦU RA (JSON Array ONLY):
[
  {
    "careerId": "string",
    "careerTitle": "string",
    "fitAnalysis": "string — dưới 100 chữ",
    "academicPathways": [
      {
        "targetMajor": "string",
        "universities": [
          {
            "name": "string",
            "subjectCombinations": [{"combination": "string", "score": number}], // Ưu tiên tổ hợp GDPT 2018 thay vì khối cũ
            "tier": "string"
          }
        ],
        "gapAnalysis": "string"
      }
    ],
    "backupOption": { "universityName": "string", "majorName": "string", "score": number, "reason": "string" } | null
  }
]

QUY TẮC:
1. 'Gợi ý chính': Phân tích MBTI/RIASEC. So sánh điểm hiện tại với điểm chuẩn. ÁNH XẠ theo Chương trình GDPT 2018 (Môn bắt buộc: Toán, Văn, Ngoại ngữ... + Các môn lựa chọn học sinh đã nhập). Chỉ định rõ cần tăng điểm môn nào.
2. 'Xem xét lại': Khách quan, dùng dữ liệu từ Lịch sử thay đổi để chứng minh tại sao ngành này hiện tại phù hợp.
3. TUYỆT ĐỐI trả về JSON hợp lệ. Không markdown, không giải thích.`,

	/**
	 * Color palette — inherited from design spec.
	 */
	colors: {
		light: {
			background: "#F5F5DC",
			card: "#FFFFFF",
			text: "#333333",
			textMuted: "#666666",
		},
		dark: {
			background: "#001F3F",
			card: "#002B5C",
			text: "#F5F5DC",
			textMuted: "#B8C4D0",
		},
		primary: "#800020",
		primaryForeground: "#FFFFFF",
		secondary: "#001F3F",
		secondaryForeground: "#F5F5DC",
		accent: "#FFD700",
		accentForeground: "#333333",
		destructive: "#DC2626",
		border: {
			light: "#D4D0C8",
			dark: "#1A3A5C",
		},
	},

	/** Typography */
	typography: {
		fontFamily: "Plus Jakarta Sans",
		monoFamily: "JetBrains Mono",
	},

	/** Animation settings */
	motion: {
		enabled: true,
		durationScale: 1.0,
		cardSpring: { type: "spring" as const, stiffness: 300, damping: 24 },
	},

	/** Feature flags */
	features: {
		themeToggle: true,
		chatEnabled: true,
		/** Whether to use DB or mock data for RAG queries */
		useDatabase: true,
	},

	/** Radar chart colors */
	chart: {
		userColor: "#800020",
		jobColor: "#001F3F",
		userColorDark: "#CC3366",
		jobColorDark: "#4A90D9",
	},

	/** Session management */
	session: {
		storageKey: "dafalcon_session_id",
	},
} as const;

export type AppConfig = typeof appConfig;
