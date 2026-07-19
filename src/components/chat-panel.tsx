"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatStore, type ProbingStep } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, RotateCcw } from "lucide-react";


const GREETING_MESSAGE =
	"Chào bạn! 👋 Mình là **daFalcon** — trợ lý tư vấn hướng nghiệp AI.\n\nMình sẽ trò chuyện với bạn để hiểu rõ **sở thích** và **tính cách**, từ đó gợi ý nghề nghiệp và trường đại học phù hợp nhất.\n\nBắt đầu nhé — bạn có thể giới thiệu đôi chút về bản thân, hoặc mình sẽ hỏi trước!";

const IDK_PHRASES = [
	"Tôi không biết",
	"Tôi cũng không rõ",
	"Câu này khó quá, bạn giải thích thêm được không?",
	"Tôi chưa có câu trả lời cho câu này",
	"Mình không rành về vấn đề này lắm",
	"Bạn có thể cho mình xin một ví dụ cụ thể hơn không?"
];

export function ChatPanel() {
	const {
		messages,
		probingStep,
		isStreaming,
		modalData,
		preferencesLog,
		addMessage,
		setProbingStep,
		setIsStreaming,
		setAiExtractedData,
		setCareerResults,
		reset,
		userDataLoaded,
		aiExtractedData,
		userRoadmap,
	} = useChatStore();

	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const idkIndexRef = useRef(0);

	const handleInitGreeting = useCallback(async () => {
		setIsStreaming(true);
		try {
			const state = useChatStore.getState();
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [],
					probingStep: "greeting",
					modalData: state.modalData,
					userRoadmap: state.userRoadmap,
					isInitGreeting: true,
				}),
			});
			const data = await res.json();
			addMessage({ role: "assistant", content: data.message || GREETING_MESSAGE });
			setProbingStep("riasec");
		} catch {
			addMessage({ role: "assistant", content: GREETING_MESSAGE });
			setProbingStep("riasec");
		} finally {
			setIsStreaming(false);
		}
	}, [addMessage, setIsStreaming, setProbingStep]);

	useEffect(() => {
		if (!userDataLoaded) return;
		if (messages.length === 0 && useChatStore.getState().messages.length === 0) {
			const hasData =
				(aiExtractedData?.hobbies && aiExtractedData.hobbies.length > 0) ||
				(aiExtractedData?.certificates && aiExtractedData.certificates.length > 0) ||
				modalData ||
				(userRoadmap && userRoadmap.length > 0) ||
				aiExtractedData?.mbti ||
				aiExtractedData?.riasec;

			if (hasData) {
				handleInitGreeting();
			} else {
				addMessage({ role: "assistant", content: GREETING_MESSAGE });
				setProbingStep("riasec");
			}
		}
	}, [messages.length, userDataLoaded, addMessage, setProbingStep, handleInitGreeting]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (probingStep !== "analyzing" && !isStreaming) {
			inputRef.current?.focus();
		}
	}, [probingStep, isStreaming]);

	const advanceProbingStep = useCallback(
		(currentStep: ProbingStep, messageCount: number): ProbingStep => {
			if (currentStep === "riasec" && messageCount >= 4) return "mbti";
			return currentStep;
		},
		[],
	);

	async function triggerRecommendation() {
		try {
			const state = useChatStore.getState();
			const riasec = state.aiExtractedData.riasec;

			// Option A: If RIASEC data is missing, don't proceed with meaningless fallback
			if (!riasec) {
				setProbingStep("riasec");
				addMessage({
					role: "assistant",
					content:
						"Mình chưa đủ dữ liệu để phân tích hồ sơ nghề nghiệp cho bạn. Bạn trả lời thêm vài câu hỏi nữa nhé! 🙏",
				});
				return;
			}

			const res = await fetch("/api/recommend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					riasec,
					mbti: state.aiExtractedData.mbti,
					modalData: state.modalData,
					preferencesLog: state.preferencesLog,
				}),
			});

			const data = await res.json();
			setCareerResults(
				data.primarySuggestions || [],
				data.reconsideredSuggestions || [],
			);
			setProbingStep("complete");

			const topCareer = data.primarySuggestions?.[0];
			const topCareerContent = topCareer 
				? `**Gợi ý hàng đầu:** ${topCareer.careerTitle}\n\n💡 *${topCareer.fitAnalysis}*` 
				: "**Top gợi ý:** Xem Dashboard";

			addMessage({
				role: "assistant",
				content: `✅ Mình đã phân tích xong! Kết quả chi tiết đã hiển thị ở bên phải.\n\n${topCareerContent}\n\nBạn có thể xem thêm lộ trình học tập và ${data.primarySuggestions?.length || 0} gợi ý khác ở **Dashboard** bên cạnh nhé!`,
			});
		} catch {
			setProbingStep("complete");
			setCareerResults([], []);
			addMessage({
				role: "assistant",
				content:
					"Xin lỗi, mình gặp lỗi khi phân tích kết quả. Bạn thử nhắn thêm vài câu để mình thử lại nhé! 🙏",
			});
		}
	}

	const handleSend = useCallback(async (textOverride?: string | React.MouseEvent) => {
		const messageText = typeof textOverride === "string" ? textOverride : input.trim();
		if (!messageText || isStreaming) return;

		addMessage({ role: "user", content: messageText });
		if (typeof textOverride !== "string") {
			setInput("");
		}
		setIsStreaming(true);

		const currentMessages = useChatStore.getState().messages;
		const newStep = advanceProbingStep(
			probingStep,
			currentMessages.length + 1,
		);
		if (newStep !== probingStep) setProbingStep(newStep);

		try {
			const chatMessages = [
				...currentMessages.map((m) => ({
					role: m.role,
					content: m.content,
				})),
				{ role: "user", content: messageText },
			].filter((m) => m.role !== "system");

			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: chatMessages,
					probingStep: newStep,
					modalData,
				}),
			});

			const data = await res.json();
			addMessage({ role: "assistant", content: data.message });

			// Sync extracted data (RIASEC/MBTI) from server to client store
			if (data.extractedData) {
				setAiExtractedData(data.extractedData);
			}

			if (data.isProfileComplete) {
				setProbingStep("analyzing");
				await triggerRecommendation();
			}
		} catch {
			addMessage({
				role: "assistant",
				content:
					"Xin lỗi, mình gặp lỗi kết nối. Bạn thử gửi lại tin nhắn nhé! 🙏",
			});
		} finally {
			setIsStreaming(false);
			inputRef.current?.focus();
		}
	}, [
		input,
		isStreaming,
		probingStep,
		modalData,
		addMessage,
		setProbingStep,
		setIsStreaming,
		advanceProbingStep,
	]);

	const handleIdkClick = useCallback(() => {
		const text = IDK_PHRASES[idkIndexRef.current % IDK_PHRASES.length];
		idkIndexRef.current += 1;
		handleSend(text);
	}, [handleSend]);

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	const stepLabels: Record<ProbingStep, string> = {
		greeting: "Bắt đầu",
		riasec: "Bước 1/2 — Sở thích & Tính cách",
		mbti: "Bước 2/2 — Phong cách làm việc",
		analyzing: "Đang phân tích...",
		complete: "Hoàn tất ✓",
	};

	return (
		<div className="flex flex-col h-full">
			{/* Step indicator */}
			<div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
				<div className="flex items-center gap-2">
					<Bot size={16} className="text-primary" />
					<span className="text-xs font-semibold text-foreground">
						{stepLabels[probingStep]}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex gap-1">
						{["riasec", "mbti"].map((step, i) => (
							<div
								key={step}
								className={`h-1.5 w-8 rounded-full transition-colors ${
									["riasec", "mbti"].indexOf(probingStep) >=
										i ||
									probingStep === "analyzing" ||
									probingStep === "complete"
										? "bg-primary"
										: "bg-muted"
								}`}
							/>
						))}
					</div>
					<button
						onClick={reset}
						className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
						title="Bắt đầu lại"
					>
						<RotateCcw size={14} />
					</button>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
				<AnimatePresence initial={false}>
					{messages.map((msg, index) => (
						<motion.div
							key={msg.id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: 0.3,
								ease: [0.16, 1, 0.3, 1],
							}}
							className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
						>
							<div
								className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
							>
								{msg.role === "user" ? (
									<User size={14} />
								) : (
									<Bot size={14} />
								)}
							</div>
							<div className="flex flex-col gap-1 max-w-[80%]">
								<div
									className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-md" : "bg-card border border-border text-foreground rounded-tl-md"}`}
								>
									{msg.role === "assistant" ? (
										<div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>table]:text-xs">
											<ReactMarkdown
												remarkPlugins={[remarkGfm]}
											>
												{msg.content}
											</ReactMarkdown>
										</div>
									) : (
										<span className="whitespace-pre-wrap">
											{msg.content}
										</span>
									)}
								</div>
								{msg.role === "assistant" && msg.content !== GREETING_MESSAGE && !isStreaming && probingStep !== "analyzing" && probingStep !== "complete" && index === messages.length - 1 && (
									<div className="flex justify-start mt-1">
										<Button 
											variant="outline" 
											size="sm" 
											className="text-[11px] rounded-full h-6 px-3 text-muted-foreground hover:text-foreground"
											onClick={handleIdkClick}
										>
											Tôi không rõ / Cho ví dụ
										</Button>
									</div>
								)}
							</div>
						</motion.div>
					))}
				</AnimatePresence>

				{isStreaming && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex gap-3"
					>
						<div className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center bg-muted text-foreground">
							<Bot size={14} />
						</div>
						<div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
							<div className="flex gap-1.5">
								{[0, 1, 2].map((i) => (
									<motion.div
										key={i}
										className="h-2 w-2 rounded-full bg-muted-foreground"
										animate={{ opacity: [0.3, 1, 0.3] }}
										transition={{
											duration: 1.2,
											repeat: Infinity,
											delay: i * 0.2,
										}}
									/>
								))}
							</div>
						</div>
					</motion.div>
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<div className="border-t border-border p-3 bg-card/50">
				<div className="flex gap-2">
					<Input
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={
							probingStep === "analyzing"
								? "Đang phân tích..."
								: "Nhập tin nhắn..."
						}
						disabled={isStreaming || probingStep === "analyzing"}
						className="flex-1"
					/>
					<Button
						onClick={handleSend}
						disabled={
							!input.trim() ||
							isStreaming ||
							probingStep === "analyzing"
						}
						size="icon"
						className="shrink-0"
					>
						{isStreaming ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<Send size={16} />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
