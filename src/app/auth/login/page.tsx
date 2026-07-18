"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, LogIn, Loader2 } from "lucide-react";

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirectTo") || "/chat";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const supabase = createClient();
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			setError(error.message);
			setLoading(false);
			return;
		}

		router.push(redirectTo);
		router.refresh();
	}

	return (
		<div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
				className="w-full max-w-sm"
			>
				<div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
					{/* Header */}
					<div className="flex flex-col items-center mb-8">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
							<Compass size={24} strokeWidth={2.5} />
						</div>
						<h1 className="text-xl font-bold text-foreground">
							Đăng nhập vào daFalcon
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Bắt đầu hành trình hướng nghiệp của bạn
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleLogin} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="email@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoComplete="email"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Mật khẩu</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								autoComplete="current-password"
								minLength={6}
							/>
						</div>

						<div className="min-h-[2.5rem]">
							{error && (
								<p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
									{error}
								</p>
							)}
						</div>

						<Button
							type="submit"
							className="w-full gap-2 font-semibold"
							size="lg"
							disabled={loading}
						>
							{loading ? (
								<Loader2 size={16} className="animate-spin" />
							) : (
								<LogIn size={16} />
							)}
							<span>Đăng nhập</span>
						</Button>
					</form>

					{/* Footer */}
					<p className="mt-6 text-center text-sm text-muted-foreground">
						Chưa có tài khoản?{" "}
						<Link
							href="/auth/signup"
							className="font-semibold text-primary hover:underline"
						>
							Đăng ký ngay
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
					<Loader2
						size={24}
						className="animate-spin text-muted-foreground"
					/>
				</div>
			}
		>
			<LoginForm />
		</Suspense>
	);
}
