"use client";

import { motion } from "framer-motion";
import { AlertCircle, Users, Tv, UserCog, HelpCircle } from "lucide-react";

const PROBLEMS = [
  {
    icon: HelpCircle,
    title: "Chọn bừa ngành học",
    description:
      "Quyết định vội vàng vì 'thấy tên ngành hay hay' mà không có cơ sở dữ liệu thực tế về độ phù hợp.",
  },
  {
    icon: Users,
    title: "Xu hướng đám đông",
    description:
      "Chạy theo các ngành 'hot' hoặc chọn trường vì bạn bè xung quanh ai cũng học, bỏ qua năng lực cốt lõi của bản thân.",
  },
  {
    icon: Tv,
    title: "Ảnh hưởng truyền thông",
    description:
      "Bị tác động bởi những bức tranh hào nhoáng trên mạng xã hội mà không thấy những khó khăn thực tế của nghề.",
  },
  {
    icon: UserCog,
    title: "Áp lực từ gia đình",
    description:
      "Theo đuổi ngành học để đáp ứng kỳ vọng của cha mẹ thay vì niềm đam mê và sở trường cá nhân.",
  },
  {
    icon: AlertCircle,
    title: "Thiếu nhận thức bản thân",
    description:
      "Chưa hiểu rõ điểm mạnh, điểm yếu thực sự. Chỉ dựa vào điểm số trên lớp để định vị khả năng nghề nghiệp.",
  },
];

export function LandingProblems() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-start">
          {/* Left Column: Sticky Context & Solution */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Tại sao chúng ta thường chọn sai ngành?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Định hướng nghề nghiệp thường bị bóp méo bởi cảm tính và yếu tố ngoại cảnh. 
                daFalcon giải quyết vấn đề này bằng cách nhìn thấu năng lực của bạn.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm"
            >
              <div className="relative h-48 sm:h-64 bg-muted w-full overflow-hidden">
                <img 
                  src="/gamified_assessment.png" 
                  alt="Gamified Assessment Concept" 
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-foreground text-lg mb-2">Đánh giá thực tế, vượt ngoài điểm số</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bên cạnh các bài test lý thuyết RIASEC và MBTI, hệ thống sử dụng các câu hỏi tình huống thực tế và minigame để đo lường khả năng cốt lõi của bạn một cách khách quan nhất.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Scrolling Problems */}
          <div className="lg:col-span-7 space-y-6">
            {PROBLEMS.map((problem, i) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex gap-6 rounded-3xl border border-border bg-muted/30 p-6 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background border border-border shadow-sm">
                  <problem.icon size={22} className="text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {problem.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
