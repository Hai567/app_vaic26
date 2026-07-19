"use client";

import { useEffect } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { CareerDashboard } from "@/components/career-dashboard";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ProfileSettings } from "@/components/profile-settings";
import { useChatStore } from "@/store/chat-store";
import { useState } from "react";
import { MessageCircle, BarChart3 } from "lucide-react";

export default function ChatPage() {
  const {
    primarySuggestions,
    reconsideredSuggestions,
    modalData,
    aiExtractedData,
    setModalData,
    setShowOnboarding,
    showOnboarding,
    showSettings,
    setUserDataLoaded,
    setUserRoadmap,
  } = useChatStore();
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard">("chat");

  const hasResults = primarySuggestions.length > 0 || reconsideredSuggestions.length > 0;

  // Fetch user data and trigger onboarding if needed
  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) return;
        const data = await res.json();

        if (data.modalData) {
          setModalData(data.modalData);
        } else {
          setShowOnboarding(true);
        }
        
        if (data.aiExtractedData) {
          setAiExtractedData(data.aiExtractedData);
        }

        // Fetch roadmap
        try {
          const rmRes = await fetch("/api/roadmap");
          if (rmRes.ok) {
            const rmData = await rmRes.json();
            setUserRoadmap(rmData.data || []);
          }
        } catch {
          // Ignore roadmap fetch error
        }
      } catch {
        // Silently fail — onboarding will show on next load
      } finally {
        setUserDataLoaded(true);
      }
    }
    loadUserData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <OnboardingModal />
      <ProfileSettings />

      <div className="h-[calc(100dvh-4rem)] flex flex-col">
        {/* Mobile tab switcher */}
        <div className="lg:hidden flex border-b border-border bg-card/80">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              activeTab === "chat"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            <MessageCircle size={16} />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === "dashboard"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            <BarChart3 size={16} />
            Dashboard
            {hasResults && (
              <span className="absolute top-2 right-[calc(50%-40px)] h-2 w-2 rounded-full bg-green-500" />
            )}
          </button>
        </div>

        {/* Split-screen layout */}
        <div className="flex-1 flex overflow-hidden">
          <div
            className={`lg:w-[60%] lg:border-r lg:border-border ${
              activeTab === "chat" ? "flex flex-col w-full" : "hidden lg:flex lg:flex-col"
            }`}
          >
            <ChatPanel />
          </div>
          <div
            className={`lg:w-[40%] bg-muted/20 ${
              activeTab === "dashboard" ? "flex flex-col w-full" : "hidden lg:flex lg:flex-col"
            }`}
          >
            <CareerDashboard />
          </div>
        </div>
      </div>
    </>
  );
}
