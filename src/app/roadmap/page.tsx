"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Map, Navigation } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RoadmapItem {
	id: string;
	status: string;
	createdAt: string;
	careerTitle: string;
	universityName: string | null;
	majorName: string | null;
}

export default function RoadmapDashboard() {
	const [items, setItems] = useState<RoadmapItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchRoadmap = async () => {
			try {
				const res = await fetch("/api/roadmap");
				if (res.ok) {
					const { data } = await res.json();
					setItems(data || []);
				}
			} catch (error) {
				console.error("Failed to fetch roadmap:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchRoadmap();
	}, []);

	return (
		<div className="flex h-screen w-full flex-col bg-background p-6 overflow-y-auto">
			<div className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
						<Map className="text-primary" /> Roadmap Học Thuật
					</h1>
					<p className="text-muted-foreground mt-1">
						Theo dõi các lộ trình và ngành nghề bạn đang quan tâm
					</p>
				</div>
				<Button render={<Link href="/chat" />} variant="outline">
					Quay lại Chat
				</Button>
			</div>

			<div className="max-w-5xl mx-auto w-full">
				{loading ? (
					<div className="flex justify-center p-12">
						<Loader2 className="animate-spin text-muted-foreground" size={32} />
					</div>
				) : items.length === 0 ? (
					<div className="text-center p-12 border rounded-xl bg-card">
						<Navigation className="mx-auto text-muted-foreground mb-4 opacity-50" size={48} />
						<h3 className="text-lg font-medium text-foreground">Roadmap của bạn đang trống</h3>
						<p className="text-muted-foreground mb-4">Hãy thêm các ngành nghề gợi ý từ trợ lý ảo vào đây nhé.</p>
						<Button render={<Link href="/chat" />}>
							Bắt đầu tư vấn
						</Button>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{items.map((item) => (
							<Card key={item.id} className="border-border bg-card">
								<CardHeader className="pb-3">
									<CardTitle className="text-lg text-foreground flex justify-between items-start">
										<span>{item.careerTitle}</span>
										<span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium ml-2 shrink-0">
											{item.status === "target" ? "Mục tiêu" : "Đang cân nhắc"}
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2 text-sm">
										{item.universityName && (
											<p className="text-muted-foreground">
												<strong className="text-foreground">Trường:</strong> {item.universityName}
											</p>
										)}
										{item.majorName && (
											<p className="text-muted-foreground">
												<strong className="text-foreground">Ngành học:</strong> {item.majorName}
											</p>
										)}
										<p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
											Đã thêm: {new Date(item.createdAt).toLocaleDateString("vi-VN")}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
