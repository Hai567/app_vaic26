"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, UserPlus, Loader2 } from "lucide-react";

export default function SignupPage() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	async function handleSignup(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const supabase = createClient();
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { display_name: displayName },
			},
		});

		if (error) {
			setError(error.message);
			setLoading(false);
			return;
		}

		setSuccess(true);
		setLoading(false);
	}

	return (
		<div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
				className="w-full max-w-sm"
			>
				{/* Success State */}
				<div
					className={`rounded-2xl border border-border bg-card p-8 shadow-lg text-center ${
						success ? "block" : "hidden"
					}`}
				>
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500 mx-auto mb-4">
						<UserPlus size={24} />
					</div>
					<h2 className="text-lg font-bold text-foreground mb-2">
						Kiểm tra email!
					</h2>
					<p className="text-sm text-muted-foreground mb-6">
						Mình đã gửi link xác nhận tới <strong>{email}</strong>. Nhấn vào
						link để hoàn tất đăng ký.
					</p>
					<Link href="/auth/login">
						<Button variant="outline" className="font-semibold">
							Quay về đăng nhập
						</Button>
					</Link>
				</div>

				{/* Form State */}
				<div
					className={`rounded-2xl border border-border bg-card p-8 shadow-lg ${
						success ? "hidden" : "block"
					}`}
				>
					{/* Header */}
					<div className="flex flex-col items-center mb-8">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
							<Compass size={24} strokeWidth={2.5} />
						</div>
						<h1 className="text-xl font-bold text-foreground">
							Tạo tài khoản daFalcon
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Miễn phí — bắt đầu tư vấn ngay
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSignup} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Tên hiển thị</Label>
							<Input
								id="name"
								type="text"
								placeholder="Nguyễn Văn A"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								required
							/>
						</div>
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
								placeholder="Ít nhất 6 ký tự"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								autoComplete="new-password"
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
								<UserPlus size={16} />
							)}
							<span>Đăng ký</span>
						</Button>
					</form>

					{/* Footer */}
					<p className="mt-6 text-center text-sm text-muted-foreground">
						Đã có tài khoản?{" "}
						<Link
							href="/auth/login"
							className="font-semibold text-primary hover:underline"
						>
							Đăng nhập
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
}
