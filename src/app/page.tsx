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
import { LandingProblems } from "@/components/landing-problems";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-32 sm:pb-32 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl leading-[1.05]">
              Tìm nghề nghiệp{" "}
              <span className="text-muted-foreground">
                phù hợp với bạn.
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
              Trò chuyện cùng AI để khám phá sở thích, tính cách và năng lực học thuật. 
              Nhận gợi ý nghề nghiệp và trường đại học chính xác nhất.
            </p>
            <div className="mt-10 flex gap-4">
              <Link href="/chat">
                <Button
                  size="lg"
                  className="gap-2 h-12 px-8 text-base shadow-sm"
                >
                  Bắt đầu tư vấn
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right: Premium Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:ml-auto"
          >
            <div className="relative rounded-3xl bg-muted/40 p-2 ring-1 ring-border shadow-2xl">
              <img
                src="/hero_ai_career.png"
                alt="AI Career Analysis Dashboard"
                className="rounded-2xl object-cover w-full h-[400px] lg:h-[500px]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problems Section */}
      <LandingProblems />

      {/* Feature Bento Grid */}
      <section className="border-t border-border bg-muted/20 pb-24 pt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-2xl"
          >
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Định hướng thông minh.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Công nghệ phân tích chuyên sâu giúp bạn đưa ra quyết định vững chắc cho tương lai.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: "Tư vấn qua Chat",
                desc: "Trò chuyện tự nhiên, không cần điền các form khảo sát dài dòng.",
                colSpan: "sm:col-span-2 lg:col-span-2",
                bg: "bg-card",
              },
              {
                icon: Brain,
                title: "Phân tích RIASEC & MBTI",
                desc: "AI phân tích sâu về sở thích và tính cách của bạn.",
                colSpan: "sm:col-span-1 lg:col-span-1",
                bg: "bg-primary/5",
              },
              {
                icon: GraduationCap,
                title: "Gợi ý Trường & Ngành",
                desc: "Đề xuất trường đại học và điểm chuẩn sát với thực tế.",
                colSpan: "sm:col-span-1 lg:col-span-1",
                bg: "bg-primary/5",
              },
              {
                icon: Shield,
                title: "Tư vấn Khách quan",
                desc: "Không nịnh bợ, phân tích hoàn toàn dựa trên dữ liệu học thuật.",
                colSpan: "sm:col-span-2 lg:col-span-2",
                bg: "bg-card",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className={`group relative overflow-hidden rounded-3xl border border-border p-8 transition-colors hover:bg-muted/50 ${feature.colSpan} ${feature.bg}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border mb-6">
                  <feature.icon size={22} className="text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Staggered */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Ba bước đơn giản
            </h2>
          </div>
          <div className="grid gap-12 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Trò chuyện",
                desc: "Trả lời các câu hỏi tình huống để AI hiểu điểm mạnh của bạn.",
              },
              {
                step: "02",
                title: "Phân tích",
                desc: "Hệ thống so sánh hồ sơ với cơ sở dữ liệu nghề nghiệp và điểm chuẩn.",
              },
              {
                step: "03",
                title: "Kết quả",
                desc: "Xem Dashboard chi tiết với ngành học, trường và lộ trình cụ thể.",
              },
            ].map((item, i) => (
              <motion.div 
                key={item.step} 
                className="relative pl-8 lg:pl-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="hidden lg:block h-px w-full bg-border absolute top-5 left-0" />
                <div className="absolute left-0 top-1.5 h-full w-px bg-border lg:hidden" />
                
                <div className="relative bg-background lg:w-fit pr-4 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/30 text-sm font-semibold text-foreground">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
