"use client";

import { motion } from "framer-motion";
import {
	GraduationCap,
	School,
	AlertTriangle,
	ShieldCheck,
} from "lucide-react";
import type { AcademicPathway as AcademicPathwayType } from "@/store/chat-store";

interface AcademicPathwayProps {
	pathways: AcademicPathwayType[];
	backupOption: {
		universityName: string;
		majorName: string;
		score: number;
		reason: string;
	} | null;
}

const tierLabels: Record<string, { label: string; color: string }> = {
	university: {
		label: "Đại học",
		color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
	},
	academy: {
		label: "Học viện",
		color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
	},
	vocational: {
		label: "Cao đẳng",
		color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
	},
};

export function AcademicPathway({
	pathways,
	backupOption,
}: AcademicPathwayProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
			className="rounded-xl border border-border bg-card p-5"
		>
			<div className="flex items-center gap-2 mb-4">
				<GraduationCap size={16} className="text-primary" />
				<h3 className="text-sm font-bold text-foreground">
					Academic Pathway
				</h3>
			</div>

			<div className="space-y-4">
				{pathways.map((pathway, idx) => (
					<div
						key={idx}
						className="rounded-lg border border-border/50 overflow-hidden"
					>
						{/* Major header */}
						<div className="bg-muted/30 px-4 py-2.5 border-b border-border/50">
							<p className="text-xs font-bold text-foreground flex items-center gap-2">
								<School size={14} className="text-primary" />
								{pathway.targetMajor}
							</p>
						</div>

						{/* University rows — with aggregated subject blocks */}
						<div className="divide-y divide-border/30">
							{pathway.universities.map((uni, uIdx) => {
								const tierInfo =
									tierLabels[uni.tier] ||
									tierLabels.university;
								return (
									<div key={uIdx} className="px-4 py-3">
										<div className="flex items-center justify-between gap-3">
											<div className="flex-1 min-w-0">
												<p className="text-xs font-semibold text-foreground truncate">
													{uni.name}
												</p>
												<span
													className={`text-[10px] font-medium px-1.5 py-0.5 rounded inline-block mt-1 ${tierInfo.color}`}
												>
													{tierInfo.label}
												</span>
											</div>
										</div>
										{/* GDPT 2018: Subject combinations with scores */}
										<div className="flex flex-wrap gap-1.5 mt-2">
											{(uni.subjectsRequired || []).map(
												(sr, srIdx) => (
													<span
														key={srIdx}
														className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-muted border border-border/50"
													>
														<span className="text-primary font-bold">
															{sr.subjects}
														</span>
														<span className="text-muted-foreground">
															:
														</span>
														<span className="text-foreground font-semibold">
															{sr.score}
														</span>
													</span>
												),
											)}
										</div>
									</div>
								);
							})}
						</div>

						{/* Gap analysis */}
						{pathway.gapAnalysis && (
							<div className="px-4 py-3 bg-amber-500/5 border-t border-amber-500/20">
								<div className="flex gap-2">
									<AlertTriangle
										size={14}
										className="text-amber-500 shrink-0 mt-0.5"
									/>
									<p className="text-xs text-foreground leading-relaxed">
										{pathway.gapAnalysis}
									</p>
								</div>
							</div>
						)}
					</div>
				))}

				{/* Backup option */}
				{backupOption && (
					<div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
						<div className="flex items-center gap-2 mb-2">
							<ShieldCheck size={14} className="text-green-500" />
							<p className="text-xs font-bold text-foreground">
								Phương án dự phòng
							</p>
						</div>
						<p className="text-xs text-foreground mb-1">
							<strong>{backupOption.universityName}</strong> —{" "}
							{backupOption.majorName}
						</p>
						<p className="text-xs text-muted-foreground">
							Điểm chuẩn: {backupOption.score} •{" "}
							{backupOption.reason}
						</p>
					</div>
				)}
			</div>
		</motion.div>
	);
}
