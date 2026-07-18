"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	ArrowRight,
	MessageCircle,
	Brain,
	GraduationCap,
	Shield,
} from "lucide-react";

export default function HomePage() {
	return (
		<div className="relative">
			{/* Hero Section */}
			<section className="mx-auto max-w-5xl px-4 pt-16 pb-20 sm:px-6 sm:pt-20">
				<div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
					{/* Left: Content */}
					<motion.div
						initial={{ opacity: 0, x: -24 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
					>
						<h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-5xl leading-[1.1]">
							Tìm nghề nghiệp{" "}
							<span className="text-primary">
								phù hợp với bạn
							</span>
						</h1>
						<p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-lg">
							Trò chuyện cùng AI để khám phá sở thích, tính cách,
							và năng lực học thuật — từ đó nhận gợi ý nghề
							nghiệp, ngành học, và trường đại học phù hợp nhất.
						</p>
						<div className="mt-8 flex gap-3">
							<Link href="/chat">
								<Button
									size="lg"
									className="gap-2 font-semibold"
								>
									Bắt đầu tư vấn
									<ArrowRight size={16} />
								</Button>
							</Link>
						</div>
					</motion.div>

					{/* Right: Feature highlights */}
					<motion.div
						className="grid gap-4 sm:grid-cols-2"
						initial={{ opacity: 0, x: 24 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{
							duration: 0.6,
							delay: 0.15,
							ease: [0.16, 1, 0.3, 1],
						}}
					>
						{[
							{
								icon: MessageCircle,
								title: "Tư vấn qua Chat",
								desc: "Trò chuyện tự nhiên — không cần điền form dài.",
							},
							{
								icon: Brain,
								title: "Phân tích RIASEC & MBTI",
								desc: "AI phân tích sở thích và tính cách của bạn.",
							},
							{
								icon: GraduationCap,
								title: "Gợi ý Trường & Ngành",
								desc: "Đề xuất trường đại học và điểm chuẩn thực tế.",
							},
							{
								icon: Shield,
								title: "Tư vấn Khách quan",
								desc: "Không nịnh bợ, phân tích dựa trên dữ liệu.",
							},
						].map((feature, i) => (
							<motion.div
								key={feature.title}
								className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.5,
									delay: 0.3 + i * 0.08,
									ease: [0.16, 1, 0.3, 1],
								}}
							>
								<feature.icon
									size={22}
									className="text-primary mb-3"
									strokeWidth={2}
								/>
								<h3 className="text-sm font-bold text-foreground">
									{feature.title}
								</h3>
								<p className="mt-1 text-xs text-muted-foreground leading-relaxed">
									{feature.desc}
								</p>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* How It Works */}
			<section className="border-t border-border bg-muted/30">
				<div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
					<h2 className="text-2xl font-bold text-foreground mb-10 text-center">
						Ba bước đơn giản
					</h2>
					<div className="grid gap-8 md:grid-cols-3">
						{[
							{
								step: "01",
								title: "Trò chuyện cùng AI",
								desc: "Trả lời các câu hỏi tình huống để AI hiểu sở thích, tính cách, và điểm mạnh.",
							},
							{
								step: "02",
								title: "AI phân tích hồ sơ",
								desc: "Hệ thống RAG so sánh hồ sơ với cơ sở dữ liệu nghề nghiệp và điểm chuẩn.",
							},
							{
								step: "03",
								title: "Nhận tư vấn chi tiết",
								desc: "Xem Dashboard với ngành học, trường đề xuất, và lộ trình học thuật cụ thể.",
							},
						].map((item) => (
							<div key={item.step} className="text-center">
								<span
									className="inline-block text-3xl font-black mb-3"
									style={{ color: "#FFD700" }}
								>
									{item.step}
								</span>
								<h3 className="text-base font-bold text-foreground mb-2">
									{item.title}
								</h3>
								<p className="text-sm text-muted-foreground">
									{item.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
