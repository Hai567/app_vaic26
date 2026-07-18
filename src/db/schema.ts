import {
	pgTable,
	uuid,
	varchar,
	jsonb,
	vector,
	integer,
	real,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { ModalData, AiExtractedData, PreferenceLogEntry } from "@/lib/constants";

/**
 * Pseudo-Knowledge Graph schema for Vietnamese career counseling.
 * Tables form: Careers -> Majors -> AdmissionScores <- Universities
 */

// 1. Careers (Nghề nghiệp) — holds the RIASEC vector
export const careers = pgTable("careers", {
	id: varchar("id", { length: 255 }).primaryKey(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description"),
	riasecVector: vector("riasec_vector", { dimensions: 6 }).notNull(), // [R, I, A, S, E, C]
});

// 2. Majors (Ngành học)
export const majors = pgTable("majors", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	careerId: varchar("career_id", { length: 255 }).references(() => careers.id),
});

// 3. Universities (Trường đại học / Học viện / Cao đẳng)
export const universities = pgTable("universities", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	region: varchar("region", { length: 100 }), // e.g., "Hà Nội", "TP.HCM"
	tier: varchar("tier", { length: 50 }), // "university" | "academy" | "vocational"
});

// 4. Knowledge Graph Edge: University Admission Info (Điểm chuẩn) — GDPT 2018 Format
export const admissionScores = pgTable("admission_scores", {
	id: uuid("id").defaultRandom().primaryKey(),
	majorId: uuid("major_id").references(() => majors.id),
	universityId: uuid("university_id").references(() => universities.id),
	// GDPT 2018: subjects as comma-separated or JSON array (e.g., "Toán,Vật lý,Hóa học,Lịch sử")
	subjectsRequired: varchar("subjects_required", { length: 255 }).notNull(),
	year: integer("year").notNull(),
	score: real("score").notNull(),
});

// 5. Education Guidelines — RAG Knowledge Base for GDPT 2018 Rules
export const educationGuidelines = pgTable("education_guidelines", {
	id: uuid("id").defaultRandom().primaryKey(),
	topic: varchar("topic", { length: 255 }).notNull(), // e.g., "GDPT 2018 Ngành Y", "ĐH FPT Yêu cầu"
	content: text("content").notNull(), // Full content for RAG injection
	embedding: vector("embedding", { dimensions: 1536 }), // For similarity search
	createdAt: timestamp("created_at").defaultNow(),
});

// 6. User Profiles — Hard/Soft Data Split + Evolution Tracking (GDPT 2018)
export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	authId: text("auth_id").unique(), // Supabase Auth user ID
	email: text("email"),
	displayName: varchar("display_name", { length: 255 }),
	// Hard data collected exactly once from the initial Input Modal
	modalData: jsonb("modal_data").$type<ModalData>(),
	// Soft data continuously extracted and updated by the LLM via Tool Calling
	aiExtractedData: jsonb("ai_extracted_data")
		.$type<AiExtractedData>()
		.default({
			certificates: [],
			careerOrientation: null,
			hobbies: [],
			mbti: null,
			riasec: null,
		}),
	// Evolution Tracking: timestamp-indexed array of preference shifts
	preferencesLog: jsonb("preferences_log")
		.$type<PreferenceLogEntry[]>()
		.default([]),
	createdAt: timestamp("created_at").defaultNow(),
});

// 7. User Roadmap — saved pathways and careers
export const userRoadmap = pgTable("user_roadmap", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id").references(() => users.id).notNull(),
	careerId: varchar("career_id", { length: 255 }).references(() => careers.id).notNull(),
	universityId: uuid("university_id").references(() => universities.id), // Optional, if they saved a specific path
	majorId: uuid("major_id").references(() => majors.id), // Optional
	status: varchar("status", { length: 50 }).default("considering"), // e.g., "considering", "target"
	createdAt: timestamp("created_at").defaultNow(),
});

// --- Relations ---

export const careersRelations = relations(careers, ({ many }) => ({
	majors: many(majors),
	userRoadmaps: many(userRoadmap),
}));

export const usersRelations = relations(users, ({ many }) => ({
	roadmaps: many(userRoadmap),
}));

export const userRoadmapRelations = relations(userRoadmap, ({ one }) => ({
	user: one(users, {
		fields: [userRoadmap.userId],
		references: [users.id],
	}),
	career: one(careers, {
		fields: [userRoadmap.careerId],
		references: [careers.id],
	}),
	university: one(universities, {
		fields: [userRoadmap.universityId],
		references: [universities.id],
	}),
	major: one(majors, {
		fields: [userRoadmap.majorId],
		references: [majors.id],
	}),
}));

export const majorsRelations = relations(majors, ({ one, many }) => ({
	career: one(careers, {
		fields: [majors.careerId],
		references: [careers.id],
	}),
	admissionScores: many(admissionScores),
}));

export const universitiesRelations = relations(universities, ({ many }) => ({
	admissionScores: many(admissionScores),
}));

export const admissionScoresRelations = relations(
	admissionScores,
	({ one }) => ({
		major: one(majors, {
			fields: [admissionScores.majorId],
			references: [majors.id],
		}),
		university: one(universities, {
			fields: [admissionScores.universityId],
			references: [universities.id],
		}),
	}),
);
