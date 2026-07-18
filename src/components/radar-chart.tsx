"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { appConfig } from "@/config/app.config";
export type RIASECScores = { R: number; I: number; A: number; S: number; E: number; C: number; };

interface SkillRadarChartProps {
  userScores: RIASECScores;
  jobScores: number[];
  jobTitle: string;
}

const AXIS_LABELS = [
  "Realistic",
  "Investigative",
  "Artistic",
  "Social",
  "Enterprising",
  "Conventional",
];
const AXIS_KEYS: (keyof RIASECScores)[] = ["R", "I", "A", "S", "E", "C"];

export function SkillRadarChart({
  userScores,
  jobScores,
  jobTitle,
}: SkillRadarChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  const data = AXIS_LABELS.map((label, i) => {
    const key = AXIS_KEYS[i];
    return {
      axis: label,
      user: userScores[key],
      job: jobScores[i],
    };
  });

  const userColor = isDark
    ? appConfig.chart.userColorDark
    : appConfig.chart.userColor;
  const jobColor = isDark
    ? appConfig.chart.jobColorDark
    : appConfig.chart.jobColor;

  if (!mounted) {
    return (
      <div className="h-[300px] w-full animate-pulse rounded-xl bg-muted" />
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid
            stroke={isDark ? "#1A3A5C" : "#D4D0C8"}
            strokeOpacity={0.6}
          />
          <PolarAngleAxis
            dataKey="axis"
            tick={{
              fill: isDark ? "#B8C4D0" : "#666666",
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tick={{ fill: isDark ? "#B8C4D0" : "#999999", fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Your Profile"
            dataKey="user"
            stroke={userColor}
            fill={userColor}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name="Market Baseline Profile"
            dataKey="job"
            stroke={jobColor}
            fill={jobColor}
            fillOpacity={0.15}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
                  <p className="text-xs font-semibold text-foreground mb-1">
                    {label}
                  </p>
                  {payload.map((entry: any) => (
                    <p
                      key={entry.name}
                      className="text-xs"
                      style={{ color: entry.color }}
                    >
                      {entry.name}: {(entry.value as number).toFixed(2)}
                    </p>
                  ))}
                  {payload[1] && (
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[180px] leading-snug">
                      Market Baseline = yêu cầu cơ bản ngành, không giới hạn tiềm năng
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: isDark ? "#F5F5DC" : "#333333",
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
