"use client";

import { Badge } from "@/components/ui/badge";

interface DisadvantageItem {
  label: string;
  value: boolean;
}

interface DisadvantageItemsProps {
  items: DisadvantageItem[];
  title?: string;
  className?: string;
  variant?: "grid" | "inline";
}

/**
 * 불이익 항목 배지 그룹 컴포넌트
 * 농기계 진입, 접면도로 상실, 수로/구거 단절, 고저차 등의 항목을 표시
 */
export function DisadvantageItems({ 
  items, 
  title = "불이익 판단 항목",
  className = "",
  variant = "grid"
}: DisadvantageItemsProps) {
  if (!items || items.length === 0) return null;

  if (variant === "inline") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <Badge variant={item.value ? "destructive" : "outline"} className="text-xs">
              {item.value ? "해당" : "미해당"}
            </Badge>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {title && <h5 className="text-sm font-semibold mb-2">{title}</h5>}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <Badge variant={item.value ? "destructive" : "outline"}>
              {item.value ? "해당" : "미해당"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// 유틸리티: AI 결과에서 불이익 항목 배열 생성
export function createDisadvantageItems(aiResult: {
  farmMachineDifficulty?: boolean;
  accessRoadLost?: boolean;
  waterChannelLost?: boolean;
  elevationDifference?: boolean;
}): DisadvantageItem[] {
  return [
    { label: "농기계 진입", value: !!aiResult.farmMachineDifficulty },
    { label: "접면도로 상실", value: !!aiResult.accessRoadLost },
    { label: "수로/구거 단절", value: !!aiResult.waterChannelLost },
    { label: "고저차", value: !!aiResult.elevationDifference },
  ];
}
