/**
 * Seed data for education_guidelines table.
 * Contains updated GDPT 2018 parameters, 2025 graduation exam structures,
 * rigorous university admission methodologies, and combination-mapping guidance.
 * Run with: npx tsx src/db/seed-education-guidelines.ts
 */

import { config as loadEnv } from "dotenv";

// Load environment variables BEFORE any other imports
loadEnv({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const EDUCATION_GUIDELINES_DATA = [
	{
		topic: "GDPT 2018 - Cấu trúc môn học cấp THPT (Điều chỉnh 2022)",
		content: `Theo chương trình giáo dục phổ thông 2018 (GDPT 2018) áp dụng hiện hành:
- 8 hạng mục bắt buộc: Ngữ văn, Toán, Ngoại ngữ 1, Lịch sử (bắt buộc từ tháng 8/2022), Giáo dục thể chất, Giáo dục Quốc phòng & An ninh, Hoạt động trải nghiệm hướng nghiệp, và Nội dung giáo dục địa phương.
- Hệ thống môn tự chọn: Học sinh được chọn 4 môn từ danh sách 9 môn độc lập (Địa lý, GDKT&PL, Vật lý, Hóa học, Sinh học, Tin học, Công nghệ, Âm nhạc, Mỹ thuật), loại bỏ phân chia 3 nhóm trước đây.
- Chuyên đề sâu: Học sinh chọn thêm 3 cụm chuyên đề học tập thuộc 3 môn học (35 tiết/năm/môn) để phục vụ định hướng nghề nghiệp.`,
	},
	{
		topic: "Kỳ thi Tốt nghiệp THPT 2025 - Mô hình 2+2 & Cấu trúc Đề thi",
		content: `Kỳ thi tốt nghiệp THPT từ năm 2025 được tổ chức theo mô hình "2+2":
- 2 bài thi bắt buộc: Toán và Ngữ văn. (Ngoại ngữ không còn bắt buộc).
- 2 bài thi tự chọn: Chọn 2 môn từ danh sách các môn đã học ở lớp 12.
- Cấu trúc đề thi mới: Ngữ văn thi tự luận 120 phút (Đọc hiểu 4đ, Viết 6đ). Các môn Trắc nghiệm chia 3 phần: Trắc nghiệm 4 chọn 1; Trắc nghiệm Đúng/Sai; Trắc nghiệm trả lời ngắn. (Môn Toán 90 phút, các môn khác 50 phút).
- Xét tốt nghiệp: Trọng số tỷ lệ 50% điểm thi và 50% điểm đánh giá học bạ (tích hợp kết quả cả lớp 10, 11 và 12).`,
	},
	{
		topic: "Tuyển sinh ĐH 2025/2026 - Nhóm ngành Công nghệ Thông tin & Kỹ thuật",
		content: `Xu hướng tuyển sinh khốc liệt khối CNTT/AI:
- ĐH Bách Khoa Hà Nội (HUST): Ngành Khoa học dữ liệu & AI (IT-E10) có điểm chuẩn 29,39 (THPT) và 81,6-83,97 (TSA). Giới thiệu tổ hợp K01 (Toán, Văn, Lý/Hóa/Sinh/Tin) với công thức quy đổi nội suy tuyến tính y = ax + b để đồng bộ các phương thức.
- ĐH Công nghệ - ĐHQGHN (UET): Điểm chuẩn CNTT (CN1) đạt 28,19 điểm. Xét thi THPT không nhân hệ số môn chính. Nhận quy đổi IELTS 7.0+ thành 10 điểm Toán. Tuyển sinh qua THPT, HSA và SAT (điểm SAT chạm mức 28/30 quy đổi).
- ĐH FPT: Yêu cầu đạt Top 50 SchoolRank THPT hoặc đạt 21 điểm tổ hợp (Toán + 2 môn bất kỳ). Hỗ trợ xét tuyển thẳng cho IELTS 6.0+ hoặc TOEFL iBT 80+. FPT Polytechnic xét học bạ liên tục.`,
	},
	{
		topic: "Tuyển sinh ĐH 2025/2026 - Nhóm ngành Khoa học Sức khỏe (Y Dược)",
		content: `Điểm chuẩn khối Y Dược duy trì mức đỉnh cao:
- ĐH Y Hà Nội (HMU): Lần đầu mở rộng xét tuyển tổ hợp A00 (Toán, Lý, Hóa) bên cạnh B00. Điểm chuẩn Y khoa là 28,13 điểm (2025). Đáng chú ý, ngành Tâm lý học khối C00 từng đạt đỉnh 28,83 điểm. Thí sinh khối B00 cần duy trì trung bình mỗi môn từ 9,0 điểm.
- ĐH Y Dược TP.HCM (UMP): Điểm chuẩn Y khoa đạt 27,34 điểm; Răng-Hàm-Mặt 26,45 điểm. Điểm SAT yêu cầu xét Y khoa lên tới 1.500 điểm.
- ĐH Dược Hà Nội (HUP): Điểm Dược học đạt 24,5 điểm. Quy chế xét tuyển khắt khe: Kết hợp SAT (1350+) với học bạ Giỏi (yêu cầu trung bình 3 môn > 8.0); hoặc xét theo kết quả bài thi ĐGTD (TSA) của HUST với công thức quy đổi 30%.`,
	},
	{
		topic: "Tuyển sinh ĐH 2025/2026 - Nhóm ngành Kinh tế, Thương mại & Quản trị",
		content: `Dịch chuyển từ xét điểm THPT sang ĐGNL và Chứng chỉ:
- ĐH Kinh tế Quốc dân (NEU): Cắt giảm chỉ tiêu thi THPT xuống còn 15%. Loại bỏ tổ hợp B00, C03, C04, D09, D10; chỉ giữ A00, A01, D01, D07. Quy đổi IELTS 8.0+ thành 10 điểm tuyệt đối.
- ĐH Ngoại thương (FTU): Điểm sàn nhận hồ sơ khắt khe (23.00-24.00). Áp dụng quy tắc trừ điểm chiết khấu: Các tổ hợp A01, D01, D07 có điểm chuẩn nội bộ thấp hơn tổ hợp A00 chính xác 1,0 điểm. Thuật toán quy đổi HSA: 27 + (Điểm HSA - 100) × 3/50.
- ĐH Thương mại (TMU): Từ chối tổ hợp C03. Bổ sung các tổ hợp mới tương thích GDPT 2018: D09 (Toán, Sử, Anh), D10 (Toán, Địa, Anh), D84 (Toán, GDKTPL, Anh) và tổ hợp TMU (Toán, Tin học, Tiếng Anh).`,
	},
	{
		topic: "Tuyển sinh ĐH 2025/2026 - Nhóm ngành Sư phạm & Kiến trúc Nghệ thuật",
		content: `- ĐH Sư phạm Hà Nội (HNUE): Nhóm ngành cốt lõi điểm chuẩn cực cao (Lịch sử 29,06 điểm; Ngữ văn 28,48 điểm; Toán học 28,27 điểm). Bùng nổ chương trình dạy bằng tiếng Anh (SP Toán dạy bằng tiếng Anh lấy 28,36 điểm). Tổ hợp xét ngoại ngữ thường nhân đôi hệ số (Tiếng Anh, Tiếng Pháp).
- ĐH Kiến trúc Hà Nội (HAU): Các ngành Kiến trúc sử dụng tổ hợp V00, V01, V02. Điểm môn Vẽ Mỹ thuật (hệ số 2) = MT1 + MT2 (thang điểm 5/bài). Áp dụng hàm quy đổi phi tuyến tính giữa THPT và Học bạ (ví dụ: 14.35 điểm THPT = 18.0 điểm Học bạ; 29.0 điểm THPT = 30.0 điểm Học bạ).`,
	},
	{
		topic: "Chiến lược Bản đồ Nghề nghiệp (Career Mapping) & Chọn Tổ hợp Môn",
		content: `Khuyến nghị chiến lược chọn 4 môn tự chọn ở lớp 10 theo hệ thống GDPT 2018:
1. KHỐI KỸ THUẬT & CÔNG NGHỆ (IT/AI/Cơ điện tử):
   Nên chọn: Vật lý, Tin học, Công nghệ, Hóa học. Lợi thế: Bao phủ khối A00, A01, tổ hợp K01 (HUST) và tương thích hoàn toàn với bài thi TSA.
2. KHỐI KHOA HỌC SỨC KHỎE (Y/Dược):
   Nên chọn: Hóa học, Sinh học, Vật lý, Tin học. Lợi thế: Đảm bảo nền tảng cho khối B00 (Y khoa cốt lõi) và A00 (hiện đã được ĐH Y Hà Nội chấp thuận).
3. KHỐI KINH TẾ & TÀI CHÍNH (FTU/NEU/TMU):
   Nên chọn: Vật lý, Hóa học (hoặc Địa lý, GDKTPL), Tin học. Lợi thế: Duy trì thế mạnh khối A00 (được FTU ưu tiên cộng điểm) và các khối D mở rộng (D01, D07, D09, D10).
LƯU Ý CỐT LÕI: Chỉ tiêu tuyển sinh qua thi THPT tại các đại học trọng điểm đang tiệm cận mức thiểu số (15%-40%). Học sinh bắt buộc phải có lộ trình luyện thi SAT, IELTS hoặc các kỳ thi HSA/TSA ngay từ lớp 10 để sống sót trong môi trường tuyển sinh phân mảnh.`,
	},
];

async function seedEducationGuidelines() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		console.error("❌ DATABASE_URL not set in .env.local");
		process.exit(1);
	}

	const client = postgres(connectionString, { prepare: false });
	const db = drizzle(client, { schema });

	try {
		console.log(
			"🌱 Seeding education_guidelines table with synthesized 2025/2026 data...",
		);

		for (const guideline of EDUCATION_GUIDELINES_DATA) {
			await db.insert(schema.educationGuidelines).values({
				topic: guideline.topic,
				content: guideline.content,
				embedding: null, // Will be populated by embedding service later
			});
			console.log(`✅ Inserted: ${guideline.topic}`);
		}

		console.log(
			"✨ Seed completed successfully! Architecture mapped to current GDPT 2018 requirements.",
		);
		await client.end();
		process.exit(0);
	} catch (error) {
		console.error("❌ Seed failed:", error);
		await client.end();
		process.exit(1);
	}
}

seedEducationGuidelines();
