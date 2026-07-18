/**
 * Vietnamese Education Constants
 *
 * GDPT 2018 subjects, regions, and grade levels for the daFalcon career counseling system.
 * Legacy subject blocks (A00, A01, etc.) are removed.
 * New format: 3 Mandatory (Toán, Văn, Ngoại ngữ) + 4 Elective subjects.
 */

/** Mandatory subjects under GDPT 2018 */
export const MANDATORY_SUBJECTS = ["Toán", "Ngữ văn", "Tiếng Anh"] as const;

export type MandatorySubject = (typeof MANDATORY_SUBJECTS)[number];

/** Elective subject pool (user selects exactly 4) */
export const ELECTIVE_SUBJECTS = [
	"Ngoại ngữ",
	"Vật lý",
	"Hóa học",
	"Sinh học",
	"Lịch sử",
	"Địa lý",
	"Kinh tế pháp luật",
	"Tin học",
	"Công nghệ (Trồng trọt/Chăn nuôi)",
	"Vẽ",
] as const;

export type ElectiveSubject = (typeof ELECTIVE_SUBJECTS)[number];

/** All individual subjects available for grade tracking (merged) */
export const SUBJECTS = [...MANDATORY_SUBJECTS, ...ELECTIVE_SUBJECTS] as const;

export type SubjectName = (typeof SUBJECTS)[number];

/** Grade levels */
export const GRADE_LEVELS = [
	{ value: 10, label: "Lớp 10" },
	{ value: 11, label: "Lớp 11" },
	{ value: 12, label: "Lớp 12" },
] as const;

/** Vietnamese regions for study preference */
export const REGIONS = [
	"Hà Nội",
	"TP.HCM",
	"Đà Nẵng",
	"Cần Thơ",
	"Hải Phòng",
	"Huế",
	"Nha Trang",
	"Bắc Ninh",
	"Thái Nguyên",
	"Vinh",
	"Khác",
] as const;

export type Region = (typeof REGIONS)[number];

/** Subject grade entry — one row in the progressive disclosure UI */
export interface SubjectGradeEntry {
	subject: SubjectName | string;
	grade10Avg: number | null;
	grade11Avg: number | null;
	grade12Mock: number | null;
}

/** ModalData shape stored in users.modal_data */
export interface ModalData {
	currentGrade: string;
	mandatorySubjects: { name: string; score: number | null }[];
	electiveSubjects: { name: string; score: number | null }[];
}

/** AiExtractedData shape stored in users.ai_extracted_data */
export interface AiExtractedData {
	certificates: string[];
	careerOrientation: string | null;
	hobbies: string[];
	mbti: string | null;
	riasec: {
		R: number;
		I: number;
		A: number;
		S: number;
		E: number;
		C: number;
	} | null;
}

/** PreferenceLog entry */
export interface PreferenceLogEntry {
	timestamp: string;
	action: "reject_career" | "trait_shift";
	targetId: string;
	targetName: string;
	reasonGiven?: string;
	oldValue?: unknown;
	newValue?: unknown;
}
