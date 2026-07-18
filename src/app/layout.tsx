import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NavBar } from "@/components/nav-bar";
import { Toaster } from "@/components/ui/sonner";

const jakarta = Plus_Jakarta_Sans({
	subsets: ["latin", "vietnamese"],
	variable: "--font-sans",
	display: "swap",
});

export const metadata: Metadata = {
	title: "daFalcon — Tư vấn Hướng nghiệp AI",
	description:
		"Chatbot tư vấn hướng nghiệp thông minh — phân tích RIASEC, MBTI, và điểm số để đề xuất nghề nghiệp, ngành học, và trường đại học phù hợp cho học sinh Việt Nam.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="vi" suppressHydrationWarning>
			<body className={`${jakarta.variable} antialiased`} suppressHydrationWarning>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<NavBar />
					<main className="min-h-[calc(100dvh-4rem)]">
						{children}
					</main>
					<Toaster position="bottom-center" richColors />
				</ThemeProvider>
			</body>
		</html>
	);
}
