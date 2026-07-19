"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useChatStore, type CareerResult } from "@/store/chat-store";
import { SkillRadarChart } from "./radar-chart";
import { AiFitAnalysis } from "./ai-fit-analysis";
import { AcademicPathway } from "./academic-pathway";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Briefcase, BarChart3, ChevronDown, XCircle, RefreshCw, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

function CareerTab({ career, onReject }: { career: CareerResult; onReject?: () => void }) {
  const { userRoadmap, setUserRoadmap } = useChatStore();
  const [loading, setLoading] = useState(false);
  
  const isAdded = userRoadmap.some(r => r.careerId === career.careerId);

  const handleToggleRoadmap = async () => {
    setLoading(true);
    try {
      if (isAdded) {
        // Remove from roadmap
        const res = await fetch("/api/roadmap", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ careerId: career.careerId })
        });
        if (res.ok) {
          setUserRoadmap(userRoadmap.filter(r => r.careerId !== career.careerId));
        }
      } else {
        // Add to roadmap
        const res = await fetch("/api/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            careerId: career.careerId,
            careerTitle: career.careerTitle,
            careerVector: career.radarData?.careerVector,
            status: "considering" 
          })
        });
        if (res.ok) {
          const json = await res.json();
          // We just need the careerId to reflect the state
          setUserRoadmap([...userRoadmap, { careerId: career.careerId }]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Radar Chart */}
      {career.radarData && (
        <div className="rounded-xl border border-border bg-card p-4">
          <SkillRadarChart
            userScores={career.radarData.userScores}
            jobScores={career.radarData.careerVector}
            jobTitle={career.careerTitle}
          />
        </div>
      )}

      {/* AI Fit Analysis */}
      {career.fitAnalysis && (
        <AiFitAnalysis analysis={career.fitAnalysis} careerTitle={career.careerTitle} />
      )}

      {/* Academic Pathway */}
      {career.academicPathways?.length > 0 && (
        <AcademicPathway pathways={career.academicPathways} backupOption={career.backupOption} />
      )}

      {/* Add to Roadmap Button */}
      <Button
        variant={isAdded ? "outline" : "default"}
        size="sm"
        onClick={handleToggleRoadmap}
        disabled={loading}
        className={cn("w-full gap-2 mt-4", isAdded ? "hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30" : "")}
      >
        {isAdded ? <CheckCircle2 size={16} className="text-green-500" /> : <BookmarkPlus size={16} />}
        {isAdded ? (loading ? "Đang xóa..." : "Đã lưu (Bấm để xóa)") : (loading ? "Đang lưu..." : "Lưu ngành này vào Roadmap")}
      </Button>

      {/* Reject button */}
      {onReject && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          className="w-full text-xs text-muted-foreground hover:text-destructive gap-1.5"
        >
          <XCircle size={14} />
          Ngành này không phù hợp với mình
        </Button>
      )}
    </div>
  );
}

export function CareerDashboard() {
  const {
    primarySuggestions,
    reconsideredSuggestions,
    activeCareerTab,
    setActiveCareerTab,
    rejectCareer,
    probingStep,
  } = useChatStore();

  const [reconsideredOpen, setReconsideredOpen] = useState(false);

  const hasResults = primarySuggestions.length > 0;

  // Empty state
  if (!hasResults) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
            <BarChart3 size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-2">Career Dashboard</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            {probingStep === "analyzing"
              ? "Đang phân tích hồ sơ của bạn..."
              : "Trả lời các câu hỏi bên trái để mình tạo bảng tư vấn chi tiết cho bạn nhé!"}
          </p>
          {probingStep === "analyzing" && (
            <motion.div className="mt-4 flex justify-center" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
          <Briefcase size={18} className="text-primary" />
          <div>
            <h2 className="text-base font-bold text-foreground">Gợi ý nghề nghiệp</h2>
            <p className="text-xs text-muted-foreground">
              {primarySuggestions.length} gợi ý chính
              {reconsideredSuggestions.length > 0 && ` • ${reconsideredSuggestions.length} đáng cân nhắc lại`}
            </p>
          </div>
        </motion.div>

        {/* Primary Suggestions — Tabs */}
        <Tabs
          value={String(activeCareerTab)}
          onValueChange={(v) => setActiveCareerTab(Number(v))}
        >
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1">
            {primarySuggestions.map((career, idx) => (
              <TabsTrigger
                key={career.careerId}
                value={String(idx)}
                className="flex-1 min-w-[100px] text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm py-2"
              >
                {career.careerTitle}
              </TabsTrigger>
            ))}
          </TabsList>

          {primarySuggestions.map((career, idx) => (
            <TabsContent key={career.careerId} value={String(idx)} className="mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={career.careerId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <CareerTab
                    career={career}
                    onReject={() => rejectCareer(career.careerId, career.careerTitle)}
                  />
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>

        {/* Reconsidered Suggestions — Collapsible */}
        {reconsideredSuggestions.length > 0 && (
          <Collapsible open={reconsideredOpen} onOpenChange={setReconsideredOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between rounded-xl border border-border/50 bg-amber-500/5 px-4 py-3 hover:bg-amber-500/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-foreground">
                    Các ngành bạn từng bỏ qua nhưng vẫn rất phù hợp với tính cách hiện tại
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-muted-foreground transition-transform ${reconsideredOpen ? "rotate-180" : ""}`}
                />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-6">
                {reconsideredSuggestions.map((career) => (
                  <div key={career.careerId}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Xem xét lại
                      </span>
                      <span className="text-sm font-bold text-foreground">{career.careerTitle}</span>
                    </div>
                    <CareerTab career={career} />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
