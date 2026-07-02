"use client";

import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

// 심사결과 타입 (이관은 목록 등 공간 제약이 있는 곳에서 사용, 심의위원회 이관은 풀네임)
export type JudgmentType = "보상" | "기각" | "이관" | "심의위원회 이관";

// 필지 정보 인터페이스
export interface LandInfo {
  address: string;
  remainingRatio: number;
}

// 심사결과 판정 함수
export function getJudgment(remainingRatio: number): JudgmentType {
  if (remainingRatio <= 30) return "보상";
  if (remainingRatio <= 50) return "이관";
  return "기각";
}

/**
 * 필지 건수 색상 정의 (중앙 관리)
 * Violet (#a78bfa)
 */
export const PARCEL_COUNT_COLORS = {
  hex: "#a78bfa",
  bg: "bg-violet-100",
  text: "text-violet-700",
} as const;

/**
 * 심사결과 색상 정의 (중앙 관리)
 * 
 * 보상 / 충족 / 수용가능: Emerald (#10b981)
 * 기각 / 미충족 / 수용불가: Rose (#f43f5e)
 * 심의위원회 이관: Amber (#f59e0b)
 */
export const JUDGMENT_COLORS = {
  // 보상 / 충족 / 수용가능 - 동일 색상 (Emerald)
  보상: {
    hex: "#10b981",
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    bgMedium: "bg-emerald-100",
    text: "text-emerald-600",
    textDark: "text-emerald-700",
    border: "border-emerald-500",
  },
  충족: {
    hex: "#10b981",
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    bgMedium: "bg-emerald-100",
    text: "text-emerald-600",
    textDark: "text-emerald-700",
    border: "border-emerald-500",
  },
  수용가능: {
    hex: "#10b981",
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    bgMedium: "bg-emerald-100",
    text: "text-emerald-600",
    textDark: "text-emerald-700",
    border: "border-emerald-500",
  },
  // 기각 / 미충족 / 수용불가 - 동일 색상 (Rose)
  기각: {
    hex: "#f43f5e",
    bg: "bg-rose-500",
    bgLight: "bg-rose-50",
    bgMedium: "bg-rose-100",
    text: "text-rose-600",
    textDark: "text-rose-700",
    border: "border-rose-500",
  },
  미충족: {
    hex: "#f43f5e",
    bg: "bg-rose-500",
    bgLight: "bg-rose-50",
    bgMedium: "bg-rose-100",
    text: "text-rose-600",
    textDark: "text-rose-700",
    border: "border-rose-500",
  },
  수용불가: {
    hex: "#f43f5e",
    bg: "bg-rose-500",
    bgLight: "bg-rose-50",
    bgMedium: "bg-rose-100",
    text: "text-rose-600",
    textDark: "text-rose-700",
    border: "border-rose-500",
  },
  // 시민 측 판정값
  "보상 가능성 높음": {
    hex: "#10b981",
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    bgMedium: "bg-emerald-100",
    text: "text-emerald-600",
    textDark: "text-emerald-700",
    border: "border-emerald-500",
  },
  "보상 가능성 낮음": {
    hex: "#f43f5e",
    bg: "bg-rose-500",
    bgLight: "bg-rose-50",
    bgMedium: "bg-rose-100",
    text: "text-rose-600",
    textDark: "text-rose-700",
    border: "border-rose-500",
  },
  // 심의위원회 이관
  이관: {
    hex: "#f59e0b",
    bg: "bg-amber-500",
    bgLight: "bg-amber-50",
    bgMedium: "bg-amber-100",
    text: "text-amber-600",
    textDark: "text-amber-700",
    border: "border-amber-500",
  },
} as const;

// 심사결과별 스타일 설정 (JUDGMENT_COLORS 기반)
export const judgmentConfig: Record<JudgmentType, { 
  bgClass: string; 
  textClass: string;
  solidClass: string;
  displayLabel?: string; // 공간이 좁은 곳에서 표시할 짧은 레이블
}> = {
  보상: { 
    bgClass: JUDGMENT_COLORS.보상.bg, 
    textClass: JUDGMENT_COLORS.보상.text,
    solidClass: `${JUDGMENT_COLORS.보상.bg} text-white`
  },
  기각: { 
    bgClass: JUDGMENT_COLORS.기각.bg, 
    textClass: JUDGMENT_COLORS.기각.text,
    solidClass: `${JUDGMENT_COLORS.기각.bg} text-white`
  },
  이관: { 
    bgClass: JUDGMENT_COLORS.이관.bg, 
    textClass: JUDGMENT_COLORS.이관.text,
    solidClass: `${JUDGMENT_COLORS.이관.bg} text-white`
  },
  "심의위원회 이관": { 
    bgClass: JUDGMENT_COLORS.이관.bg, 
    textClass: JUDGMENT_COLORS.이관.text,
    solidClass: `${JUDGMENT_COLORS.이관.bg} text-white`,
    displayLabel: "이관" // 목록 등 공간이 좁은 곳에서는 "이관"으로 표시
  },
};

// 단일 심사결과 배지
export function JudgmentBadge({ 
  type, 
  count,
  showLabel = true,
  prefix,
  useShortLabel = true, // 기본값: 공간이 좁은 곳에서는 짧은 레이블 사용
}: { 
  type: JudgmentType; 
  count?: number;
  showLabel?: boolean;
  prefix?: string;
  useShortLabel?: boolean;
}) {
  const config = judgmentConfig[type];
  
  // config가 undefined인 경우 기본값 사용
  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
        {prefix && <span className="font-medium mr-1">{prefix}</span>}
        {showLabel ? type : ""}{count !== undefined ? ` ${count}` : ""}
      </span>
    );
  }
  
  const displayText = useShortLabel && config.displayLabel ? config.displayLabel : type;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.solidClass}`}>
      {prefix && <span className="font-medium mr-1">{prefix}</span>}
      {showLabel ? displayText : ""}{count !== undefined ? ` ${count}` : ""}
    </span>
  );
}

// 심사결과 요약 배지 (HoverCard 포함)
export function JudgmentSummaryBadge({ 
  lands,
  showHoverCard = true,
}: { 
  lands: LandInfo[];
  showHoverCard?: boolean;
}) {
  // 판정 결과별 개수 세기
  const judgments = lands.map(land => getJudgment(land.remainingRatio));
  
  const judgmentCounts = {
    보상: judgments.filter(j => j === "보상").length,
    기각: judgments.filter(j => j === "기각").length,
    이관: judgments.filter(j => j === "이관").length,
  };

  const badges = (
    <div className="flex items-center gap-2 cursor-pointer">
      {judgmentCounts.보상 > 0 && (
        <JudgmentBadge type="보상" count={judgmentCounts.보상} />
      )}
      {judgmentCounts.기각 > 0 && (
        <JudgmentBadge type="기각" count={judgmentCounts.기각} />
      )}
      {judgmentCounts.이관 > 0 && (
        <JudgmentBadge type="이관" count={judgmentCounts.이관} />
      )}
    </div>
  );

  if (!showHoverCard) {
    return badges;
  }

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        {badges}
      </HoverCardTrigger>
      <HoverCardContent className="w-auto min-w-[160px]" align="center">
        <div className="space-y-2">
          <p className="text-sm font-semibold">심사 결과 상세</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {lands.map((land, idx) => {
              const judgment = getJudgment(land.remainingRatio);
              const config = judgmentConfig[judgment];
              return (
                <div key={idx} className="text-xs">
                  <span className="font-medium">{idx + 1}:</span>{" "}
                  <span className="text-muted-foreground">{land.address.split(" ").slice(-2).join(" ")}</span>{" "}
                  <span className={`font-medium ${config.textClass}`}>({judgment})</span>
                </div>
              );
            })}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
