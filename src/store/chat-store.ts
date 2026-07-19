"use client";

import { create } from "zustand";
import type { ModalData, AiExtractedData, PreferenceLogEntry } from "@/lib/constants";

export interface ChatMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: number;
}

export type ProbingStep =
	| "greeting"
	| "riasec"
	| "mbti"
	| "analyzing"
	| "complete";

export interface AcademicPathway {
	targetMajor: string;
	universities: {
		name: string;
		subjectsRequired: { subjects: string; score: number }[]; // GDPT 2018: "Toán,Vật lý,Hóa học,Lịch sử"
		tier: string;
	}[];
	gapAnalysis: string;
}

export interface CareerResult {
	careerId: string;
	careerTitle: string;
	fitAnalysis: string;
	overview?: string;
	salaryInfo?: string;
	subSectors?: string[];
	futureCareers?: string[];
	academicPathways: AcademicPathway[];
	backupOption: {
		universityName: string;
		majorName: string;
		score: number;
		reason: string;
	} | null;
	radarData: {
		userScores: {
			R: number;
			I: number;
			A: number;
			S: number;
			E: number;
			C: number;
		};
		careerVector: number[];
	} | null;
}

interface ChatState {
	messages: ChatMessage[];
	probingStep: ProbingStep;
	modalData: ModalData | null;
	aiExtractedData: AiExtractedData;
	preferencesLog: PreferenceLogEntry[];
	primarySuggestions: CareerResult[];
	reconsideredSuggestions: CareerResult[];
	activeCareerTab: number;
	isStreaming: boolean;
	showOnboarding: boolean;
	showSettings: boolean;
	userDataLoaded: boolean;
	userRoadmap: any[];

	addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
	setProbingStep: (step: ProbingStep) => void;
	setModalData: (data: ModalData) => void;
	setAiExtractedData: (data: Partial<AiExtractedData>) => void;
	setCareerResults: (
		primary: CareerResult[],
		reconsidered: CareerResult[],
	) => void;
	setActiveCareerTab: (idx: number) => void;
	addPreferenceLog: (entry: PreferenceLogEntry) => void;
	rejectCareer: (
		careerId: string,
		careerName: string,
		reason?: string,
	) => void;
	setIsStreaming: (streaming: boolean) => void;
	setShowOnboarding: (show: boolean) => void;
	setShowSettings: (show: boolean) => void;
	setUserDataLoaded: (loaded: boolean) => void;
	setUserRoadmap: (roadmap: any[]) => void;
	reset: () => void;
}

const initialAiExtractedData: AiExtractedData = { 
	certificates: [],
	careerOrientation: null,
	hobbies: [],
	riasec: null, 
	mbti: null 
};

const initialState = {
	messages: [] as ChatMessage[],
	probingStep: "greeting" as ProbingStep,
	modalData: null as ModalData | null,
	aiExtractedData: initialAiExtractedData,
	preferencesLog: [] as PreferenceLogEntry[],
	primarySuggestions: [] as CareerResult[],
	reconsideredSuggestions: [] as CareerResult[],
	activeCareerTab: 0,
	isStreaming: false,
	showOnboarding: false,
	showSettings: false,
	userDataLoaded: false,
	userRoadmap: [] as any[],
};

export const useChatStore = create<ChatState>((set) => ({
	...initialState,

	addMessage: (msg) =>
		set((state) => ({
			messages: [
				...state.messages,
				{ ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
			],
		})),

	setProbingStep: (step) => set({ probingStep: step }),

	setModalData: (data) => set({ modalData: data }),

	setAiExtractedData: (data) =>
		set((state) => ({ aiExtractedData: { ...state.aiExtractedData, ...data } })),

	setCareerResults: (primary, reconsidered) =>
		set({
			primarySuggestions: primary,
			reconsideredSuggestions: reconsidered,
			activeCareerTab: 0,
		}),

	setActiveCareerTab: (idx) => set({ activeCareerTab: idx }),

	addPreferenceLog: (entry) =>
		set((state) => ({ preferencesLog: [...state.preferencesLog, entry] })),

	rejectCareer: (careerId, careerName, reason) =>
		set((state) => ({
			preferencesLog: [
				...state.preferencesLog,
				{
					timestamp: new Date().toISOString(),
					action: "reject_career" as const,
					targetId: careerId,
					targetName: careerName,
					reasonGiven: reason,
				},
			],
			// Move from primary to reconsidered
			primarySuggestions: state.primarySuggestions.filter(
				(c) => c.careerId !== careerId,
			),
			reconsideredSuggestions: [
				...state.reconsideredSuggestions,
				...state.primarySuggestions.filter(
					(c) => c.careerId === careerId,
				),
			],
		})),

	setIsStreaming: (streaming) => set({ isStreaming: streaming }),
	setShowOnboarding: (show) => set({ showOnboarding: show }),
	setShowSettings: (show) => set({ showSettings: show }),
	setUserDataLoaded: (loaded) => set({ userDataLoaded: loaded }),
	setUserRoadmap: (roadmap) => set({ userRoadmap: roadmap }),

	reset: () => set(initialState),
}));
