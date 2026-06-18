"use client";

import { Badge } from "@/components/ui/badge";

type AIJudgmentType = "매수 가능성 높음" | "매수 가능성 낮음" | "수용가능" | "수용불가";

interface AIJudgmentBadgeProps {
  judgment: AIJudgmentType | string;
  size?: "sm" | "md" | "lg";
}

export function AIJudgmentBadge({ judgment, size = "md" }: AIJudgmentBadgeProps) {
  const isHigh = judgment === "매수 가능성 높음" || judgment === "수용가능";
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-[15px] px-3 py-1.5"
  };
  
  const displayText = judgment === "수용가능" ? "높음" 
    : judgment === "수용불가" ? "낮음"
    : judgment === "매수 가능성 높음" ? "높음"
    : judgment === "매수 가능성 낮음" ? "낮음"
    : judgment;
  
  return (
    <Badge
      className={`${sizeClasses[size]} border-0 ${
        isHigh
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-rose-50 text-rose-600 hover:bg-rose-100"
      }`}
    >
      {displayText}
    </Badge>
  );
}

// AI 판정 여부 확인 헬퍼 함수
export function isHighPossibility(judgment: string): boolean {
  return judgment === "매수 가능성 높음" || judgment === "수용가능";
}
