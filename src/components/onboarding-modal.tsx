"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/store/chat-store";
import {
	ELECTIVE_SUBJECTS,
	GRADE_LEVELS,
	type ModalData,
} from "@/lib/constants";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { GraduationCap, Plus, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type OnboardingStep = "grade_electives" | "scores";

export function OnboardingModal() {
	const { showOnboarding, setShowOnboarding, setModalData } = useChatStore();
	const [step, setStep] = useState<OnboardingStep>("grade_electives");
	
	const [currentGrade, setCurrentGrade] = useState<string>("12");
	const [mathScore, setMathScore] = useState<number | null>(null);
	const [litScore, setLitScore] = useState<number | null>(null);
	const [selectedElectives, setSelectedElectives] = useState<{name: string, score: number | null}[]>([]);
	
	const [electiveOpen, setElectiveOpen] = useState(false);

	function toggleElectiveSubject(subject: string) {
		if (selectedElectives.some((s) => s.name === subject)) {
			setSelectedElectives(selectedElectives.filter((s) => s.name !== subject));
		} else if (selectedElectives.length < 2) {
			setSelectedElectives([...selectedElectives, { name: subject, score: null }]);
		}
		setElectiveOpen(false);
	}

	function updateElectiveScore(subjectName: string, value: string) {
		const num = value === "" ? null : parseFloat(value);
		setSelectedElectives(prev => prev.map(s => s.name === subjectName ? { ...s, score: num } : s));
	}

	function handleFinish() {
		const data: ModalData = {
			currentGrade,
			mandatorySubjects: [
				{ name: "Toán", score: mathScore },
				{ name: "Ngữ văn", score: litScore }
			],
			electiveSubjects: selectedElectives,
		};
		setModalData(data);

		fetch("/api/user", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ modalData: data }),
		}).catch(console.error);

		setShowOnboarding(false);
	}

	const availableElectives = ELECTIVE_SUBJECTS.filter(
		(s) => !selectedElectives.some(sel => sel.name === s),
	);

	const canProceedToScores = selectedElectives.length === 2;

	return (
		<Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
			<DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
				<DialogHeader className="p-6 pb-4 border-b border-border">
					<DialogTitle className="text-lg font-bold">
						Hồ sơ học tập cơ bản
					</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						Cho mình biết một chút về việc học của bạn nhé
					</DialogDescription>
					{/* Progress bar */}
					<div className="w-full bg-secondary h-1.5 rounded-full mt-4 overflow-hidden">
						<motion.div
							className="h-full bg-primary"
							initial={{ width: "50%" }}
							animate={{ width: step === "grade_electives" ? "50%" : "100%" }}
							transition={{ duration: 0.3 }}
						/>
					</div>
				</DialogHeader>

				<div className="relative min-h-[350px] max-h-[60vh] overflow-x-hidden overflow-y-auto bg-card">
					<AnimatePresence mode="wait">
						{step === "grade_electives" && (
							<motion.div
								key="grade_electives"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="p-6 space-y-6"
							>
								{/* Grade */}
								<div className="space-y-3">
									<Label className="text-base font-semibold flex items-center gap-2">
										<GraduationCap size={18} className="text-primary" />
										Bạn đang học lớp mấy?
									</Label>
									<div className="grid grid-cols-3 gap-3">
										{GRADE_LEVELS.map((g) => (
											<button
												key={g.value}
												onClick={() => setCurrentGrade(g.value.toString())}
												className={cn(
													"rounded-xl border-2 py-3 text-sm font-bold transition-all",
													currentGrade === g.value.toString()
														? "border-primary bg-primary/10 text-primary"
														: "border-border text-foreground hover:border-primary/40",
												)}
											>
												{g.label}
											</button>
										))}
									</div>
								</div>

								{/* Electives */}
								<div className="space-y-3">
									<Label className="text-base font-semibold flex items-center gap-2">
										Chọn 2 môn tự chọn
									</Label>
									<p className="text-xs text-muted-foreground mb-2">Bên cạnh Toán và Ngữ Văn</p>
									<div className="flex flex-wrap gap-2">
										{selectedElectives.map((s) => (
											<button
												key={s.name}
												onClick={() => toggleElectiveSubject(s.name)}
												className="px-3 py-1.5 rounded-full bg-secondary text-foreground text-sm font-medium flex items-center gap-1"
											>
												{s.name} <X size={14} />
											</button>
										))}
									</div>
									{selectedElectives.length < 2 && (
										<Popover open={electiveOpen} onOpenChange={setElectiveOpen}>
											<PopoverTrigger className="w-full flex items-center justify-center gap-2 border-dashed border rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
												<Plus size={16} /> Thêm môn ({selectedElectives.length}/2)
											</PopoverTrigger>
											<PopoverContent className="w-[400px] p-0" align="start">
												<Command>
													<CommandInput placeholder="Tìm môn học..." />
													<CommandList>
														<CommandEmpty>Không tìm thấy</CommandEmpty>
														<CommandGroup>
															{availableElectives.map((s) => (
																<CommandItem
																	key={s}
																	value={s}
																	onSelect={() => toggleElectiveSubject(s)}
																>
																	{s}
																</CommandItem>
															))}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
									)}
								</div>
							</motion.div>
						)}

						{step === "scores" && (
							<motion.div
								key="scores"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="p-6 space-y-6"
							>
								<div className="space-y-2">
									<Label className="text-base font-semibold">Điểm số ước tính (không bắt buộc)</Label>
									<p className="text-sm text-muted-foreground">
										Bạn có thể bỏ qua nếu chưa có điểm, AI sẽ tự hỏi sau nếu cần.
									</p>
								</div>

								<div className="space-y-4">
									<div className="flex items-center gap-4">
										<div className="flex-1 font-medium">Toán</div>
										<Input 
											className="w-24 text-center" type="number" min={0} max={10} step={0.1} placeholder="—"
											value={mathScore ?? ""}
											onChange={(e) => setMathScore(e.target.value ? parseFloat(e.target.value) : null)}
										/>
									</div>
									<div className="flex items-center gap-4">
										<div className="flex-1 font-medium">Ngữ văn</div>
										<Input 
											className="w-24 text-center" type="number" min={0} max={10} step={0.1} placeholder="—"
											value={litScore ?? ""}
											onChange={(e) => setLitScore(e.target.value ? parseFloat(e.target.value) : null)}
										/>
									</div>
									{selectedElectives.map(s => (
										<div key={s.name} className="flex items-center gap-4">
											<div className="flex-1 font-medium">{s.name}</div>
											<Input 
												className="w-24 text-center" type="number" min={0} max={10} step={0.1} placeholder="—"
												value={s.score ?? ""}
												onChange={(e) => updateElectiveScore(s.name, e.target.value)}
											/>
										</div>
									))}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Footer Controls */}
				<div className="p-4 border-t border-border bg-muted/30 flex justify-between">
					{step === "scores" ? (
						<Button variant="ghost" onClick={() => setStep("grade_electives")}>
							Quay lại
						</Button>
					) : (
						<div />
					)}
					{step === "grade_electives" ? (
						<Button onClick={() => setStep("scores")} disabled={!canProceedToScores} className="gap-2">
							Tiếp tục <ChevronRight size={16} />
						</Button>
					) : (
						<Button onClick={handleFinish} className="gap-2 px-8">
							Hoàn tất
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
