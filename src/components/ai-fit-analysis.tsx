"use client";

import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";

interface AiFitAnalysisProps {
  analysis: string;
  careerTitle: string;
  isReconsidered?: boolean;
}

export function AiFitAnalysis({ analysis, careerTitle, isReconsidered }: AiFitAnalysisProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        {isReconsidered ? (
          <RefreshCw size={16} className="text-amber-500" />
        ) : (
          <Sparkles size={16} className="text-accent" style={{ color: "#FFD700" }} />
        )}
        <h3 className="text-sm font-bold text-foreground">
          {isReconsidered ? "Tại sao nên xem xét lại?" : "Phân tích AI"}
        </h3>
      </div>

      <div className={`rounded-lg p-4 ${isReconsidered ? "bg-amber-500/5 border border-amber-500/20" : "bg-muted/30 border border-border/50"}`}>
        <p className="text-xs font-semibold mb-1.5" style={{ color: isReconsidered ? undefined : "var(--primary)" }}>
          {isReconsidered
            ? `Tại sao ${careerTitle} đáng cân nhắc lại?`
            : `Tại sao ${careerTitle} phù hợp với bạn?`}
        </p>
        <p className="text-sm text-foreground leading-relaxed">{analysis}</p>
      </div>
    </motion.div>
  );
}
