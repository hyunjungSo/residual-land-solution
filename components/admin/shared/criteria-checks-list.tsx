"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// 판정 기준 충족 여부 아이템 타입
export interface CriteriaCheck {
  criteria?: string;
  criteriaName?: string;
  criteriaDescription?: string;
  isMet: boolean;
}

// 표시 변형 타입
type CriteriaListVariant = "simple" | "detailed" | "badge";

interface CriteriaChecksListProps {
  checks: CriteriaCheck[];
  title?: string;
  variant?: CriteriaListVariant;
  className?: string;
}

// 색상 상수
const JUDGMENT_COLORS = {
  충족: { bg: "bg-emerald-500", text: "text-emerald-600" },
  미충족: { bg: "bg-rose-500", text: "text-rose-500" },
};

/**
 * 판정 기준 충족 여부 목록 컴포넌트
 * 
 * variant:
 * - "simple": 아이콘 + 텍스트만 표시 (parcel-detail-review에서 사용)
 * - "detailed": 배경색 + 설명 + 배지 포함 (parcel-pre-registration에서 사용)
 * - "badge": 아이콘 없이 배지만 표시 (application-detail에서 사용)
 */
export function CriteriaChecksList({ 
  checks, 
  title = "판정 기준 충족 여부",
  variant = "simple",
  className = ""
}: CriteriaChecksListProps) {
  if (!checks || checks.length === 0) return null;

  const getName = (check: CriteriaCheck) => check.criteria || check.criteriaName || "";

  // Simple variant - 아이콘과 텍스트만 표시
  if (variant === "simple") {
    return (
      <div className={className}>
        <h5 className="text-[15px] font-semibold mb-2">{title}</h5>
        <div className="space-y-1 rounded-lg p-2" style={{ backgroundColor: "rgb(251, 251, 251)" }}>
          {checks.map((check, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[15px] py-1">
              {check.isMet ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              )}
              <span>{getName(check)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detailed variant - 배경색 + 설명 + 배지 포함
  if (variant === "detailed") {
    return (
      <div className={`space-y-3 ${className}`}>
        <h4 className="font-semibold">{title}</h4>
        <div className="space-y-2">
          {checks.map((check, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                check.isMet ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {check.isMet ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium">{getName(check)}</p>
                  {check.criteriaDescription && (
                    <p className="text-[15px] text-muted-foreground">{check.criteriaDescription}</p>
                  )}
                </div>
              </div>
              <Badge variant={check.isMet ? "default" : "secondary"}>
                {check.isMet ? "충족" : "미충족"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Badge variant - application-detail에서 사용하는 스타일
  return (
    <div className={`rounded-lg bg-white/60 p-3 border ${className}`}>
      <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      <div className="space-y-2">
        {checks.map((check, cIdx) => (
          <div key={cIdx} className="flex items-center justify-between text-[15px]">
            <span className="text-muted-foreground">{getName(check)}</span>
            <Badge 
              variant="default" 
              className={`text-xs text-white ${check.isMet ? JUDGMENT_COLORS.충족.bg : JUDGMENT_COLORS.미충족.bg}`}
            >
              {check.isMet ? "충족" : "미충족"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
