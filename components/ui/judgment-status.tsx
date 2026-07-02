"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JUDGMENT_COLORS } from "@/components/ui/judgment-badge";

// AI 판정 결과: 관리자(수용가능/수용불가), 시민(보상 가능성 높음/보상 가능성 낮음)
export type JudgmentType = "수용가능" | "수용불가" | "보상 가능성 높음" | "보상 가능성 낮음" | "분석중";

interface JudgmentStatusProps {
  judgment: JudgmentType | string;
  variant?: "badge" | "text";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * AI 판정 상태 표시 컴포넌트
 * 
 * 사용 가이드:
 * 1. Badge 형식 (variant="badge"): 카드 헤더, 목록 아이템, 강조 필요 시
 * 2. Text 형식 (variant="text"): 본문 내 인라인, 테이블, 상세 정보 영역
 */
export function JudgmentStatus({ 
  judgment, 
  variant = "badge", 
  size = "md",
  className 
}: JudgmentStatusProps) {
  const getColors = () => {
    switch (judgment) {
      // AI 판정 결과 - JUDGMENT_COLORS 사용
      case "수용가능":
        return {
          badge: `${JUDGMENT_COLORS.수용가능.bg} text-white hover:${JUDGMENT_COLORS.수용가능.bg}`,
          text: JUDGMENT_COLORS.수용가능.text
        };
      case "수용불가":
        return {
          badge: `${JUDGMENT_COLORS.수용불가.bg} text-white hover:${JUDGMENT_COLORS.수용불가.bg}`,
          text: JUDGMENT_COLORS.수용불가.text
        };
      case "보상 가능성 높음":
        return {
          badge: `${JUDGMENT_COLORS["보상 가능성 높음"].bg} text-white hover:${JUDGMENT_COLORS["보상 가능성 높음"].bg}`,
          text: JUDGMENT_COLORS["보상 가능성 높음"].text
        };
      case "보상 가능성 낮음":
        return {
          badge: `${JUDGMENT_COLORS["보상 가능성 낮음"].bg} text-white hover:${JUDGMENT_COLORS["보상 가능성 낮음"].bg}`,
          text: JUDGMENT_COLORS["보상 가능성 낮음"].text
        };
      default:
        return {
          badge: "bg-gray-400 text-white hover:bg-gray-400",
          text: "text-gray-500"
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          badge: "text-xs px-2 py-0.5",
          text: "text-xs"
        };
      case "lg":
        return {
          badge: "text-base px-3 py-1",
          text: "text-base"
        };
      default:
        return {
          badge: "text-sm px-2.5 py-0.5",
          text: "text-sm"
        };
    }
  };

  const colors = getColors();
  const sizeClasses = getSizeClasses();

  if (variant === "text") {
    return (
      <span className={cn("font-semibold", colors.text, sizeClasses.text, className)}>
        {judgment}
      </span>
    );
  }

  return (
    <Badge className={cn("font-semibold", colors.badge, sizeClasses.badge, className)}>
      {judgment}
    </Badge>
  );
}

/**
 * 수용여부 O/X 표시 (심의서용)
 */
export function JudgmentOX({ 
  judgment,
  className 
}: { 
  judgment: JudgmentType | string;
  className?: string;
}) {
  const isAccepted = judgment === "수용가능" || judgment === "매수" || judgment === "보상 가능성 높음";
  
  return (
    <span className={cn(
      "font-bold",
      isAccepted ? JUDGMENT_COLORS.수용가능.text : JUDGMENT_COLORS.수용불가.text,
      className
    )}>
      {isAccepted ? "O" : "X"}
    </span>
  );
}
