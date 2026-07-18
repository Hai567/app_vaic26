"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/store/chat-store";
import {
	ELECTIVE_SUBJECTS,
	GRADE_LEVELS,
	type ModalData,
	type ElectiveSubject,
} from "@/lib/constants";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
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
import { Settings, Plus, X, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfileSettings() {
	const { showSettings, setShowSettings, modalData, setModalData } =
		useChatStore();

	const [currentGrade, setCurrentGrade] = useState<string>("12");
	const [mathScore, setMathScore] = useState<number | null>(null);
	const [litScore, setLitScore] = useState<number | null>(null);
	
	const [selectedElectives, setSelectedElectives] = useState<{name: string, score: number | null}[]>([]);
	const [saving, setSaving] = useState(false);
	const [electiveOpen, setElectiveOpen] = useState(false);

	// Sync from store when opening
	useEffect(() => {
		if (showSettings && modalData) {
			setCurrentGrade(modalData.currentGrade);
			const m = modalData.mandatorySubjects.find(s => s.name === "Toán");
			const v = modalData.mandatorySubjects.find(s => s.name === "Ngữ văn");
			setMathScore(m?.score ?? null);
			setLitScore(v?.score ?? null);
			setSelectedElectives([...(modalData.electiveSubjects || [])]);
		}
	}, [showSettings, modalData]);

	function toggleElectiveSubject(subject: string) {
		if (selectedElectives.some((s) => s.name === subject)) {
			setSelectedElectives(
				selectedElectives.filter((s) => s.name !== subject),
			);
		} else if (selectedElectives.length < 2) {
			setSelectedElectives([...selectedElectives, { name: subject, score: null }]);
		}
	}

	function updateElectiveScore(subjectName: string, value: string) {
		const num = value === "" ? null : parseFloat(value);
		setSelectedElectives(prev => prev.map(s => s.name === subjectName ? { ...s, score: num } : s));
	}

	async function handleSave() {
		setSaving(true);
		const data: ModalData = {
			currentGrade,
			mandatorySubjects: [
				{ name: "Toán", score: mathScore },
				{ name: "Ngữ văn", score: litScore }
			],
			electiveSubjects: selectedElectives,
		};

		setModalData(data);

		try {
			await fetch("/api/user", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ modalData: data }),
			});
		} catch (e) {
			console.error("Failed to save profile:", e);
		}

		setSaving(false);
		setShowSettings(false);
	}

	const availableElectives = ELECTIVE_SUBJECTS.filter(
		(s) => !selectedElectives.some(sel => sel.name === s),
	);

	return (
		<Dialog open={showSettings} onOpenChange={setShowSettings}>
			<DialogContent className="sm:max-w-[420px] max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings size={18} />
						Cập nhật hồ sơ học tập
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-2">
					{/* Grade */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold">
							Lớp hiện tại
						</Label>
						<div className="flex gap-2">
							{GRADE_LEVELS.map((g) => (
								<button
									key={g.value}
									onClick={() =>
										setCurrentGrade(g.value.toString())
									}
									className={cn(
										"flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition-all",
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

					{/* Mandatory Subjects */}
					<div className="space-y-3">
						<Label className="text-sm font-semibold">
							Điểm môn bắt buộc
						</Label>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label className="text-xs text-muted-foreground">Toán</Label>
								<Input 
									type="number" min={0} max={10} step={0.1} placeholder="—"
									value={mathScore ?? ""}
									onChange={(e) => setMathScore(e.target.value ? parseFloat(e.target.value) : null)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs text-muted-foreground">Ngữ văn</Label>
								<Input 
									type="number" min={0} max={10} step={0.1} placeholder="—"
									value={litScore ?? ""}
									onChange={(e) => setLitScore(e.target.value ? parseFloat(e.target.value) : null)}
								/>
							</div>
						</div>
					</div>

					{/* Elective Subjects */}
					<div className="space-y-3">
						<Label className="text-sm font-semibold">
							Môn tự chọn ({selectedElectives.length}/2)
						</Label>
						
						{selectedElectives.length > 0 && (
							<div className="space-y-3">
								{selectedElectives.map((s) => (
									<div key={s.name} className="flex items-center gap-2">
										<div className="flex-1 px-3 py-2 border rounded-md text-sm bg-muted/50">
											{s.name}
										</div>
										<Input 
											className="w-20"
											type="number" min={0} max={10} step={0.1} placeholder="Điểm"
											value={s.score ?? ""}
											onChange={(e) => updateElectiveScore(s.name, e.target.value)}
										/>
										<Button variant="ghost" size="icon" onClick={() => toggleElectiveSubject(s.name)}>
											<X size={16} />
										</Button>
									</div>
								))}
							</div>
						)}

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
														onSelect={() => {
															toggleElectiveSubject(s);
															setElectiveOpen(false);
														}}
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
				</div>

				<div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
					<Button
						variant="ghost"
						onClick={() => setShowSettings(false)}
					>
						Hủy
					</Button>
					<Button
						onClick={handleSave}
						disabled={saving}
						className="gap-2"
					>
						<Save size={16} />
						{saving ? "Đang lưu..." : "Lưu hồ sơ"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
