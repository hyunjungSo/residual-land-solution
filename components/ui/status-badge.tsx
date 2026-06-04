"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, PlayCircle, CheckCircle2 } from "lucide-react";
import type { AdminStatus, ProcessStatus } from "@/lib/types";

// 담당자 진행상황 (접수완료/진행중/심사완료) - 새 컬러 시스템 적용
const adminStatusConfig: Record<AdminStatus, {
  label: string;
  icon: typeof Clock;
  variant: "outline-indigo" | "outline-blue" | "outline-green";
}> = {
  접수완료: {
    label: "접수완료",
    icon: Clock,
    variant: "outline-indigo", // Indigo #6366F1: 신규 접수 강조
  },
  진행중: {
    label: "진행중",
    icon: PlayCircle,
    variant: "outline-blue", // Blue: 활동 상태 강조
  },
  심사완료: {
    label: "심사완료",
    icon: CheckCircle2,
    variant: "outline-green", // Green: 완료 상태 강조
  },
};

// 처리 상태 (접수완료/AI분석완료/검토중/처리완료)
const processStatusConfig: Record<ProcessStatus, {
  label: string;
  icon: typeof Clock;
  variant: "secondary" | "info" | "warning" | "success";
}> = {
  접수완료: {
    label: "접수완료",
    icon: Clock,
    variant: "secondary",
  },
  AI분석완료: {
    label: "AI 분석 완료",
    icon: Clock,
    variant: "info",
  },
  검토중: {
    label: "검토 중",
    icon: Clock,
    variant: "warning",
  },
  처리완료: {
    label: "처리 완료",
    icon: CheckCircle2,
    variant: "success",
  },
};

interface AdminStatusBadgeProps {
  status: AdminStatus;
  showIcon?: boolean;
  size?: "sm" | "default";
}

interface ProcessStatusBadgeProps {
  status: ProcessStatus;
  showIcon?: boolean;
  size?: "sm" | "default";
}

// 담당자 진행상황 Badge
export function AdminStatusBadge({ status, showIcon = false, size = "default" }: AdminStatusBadgeProps) {
  const config = adminStatusConfig[status];
  
  // 안전한 처리: config가 없으면 기본값 사용
  if (!config) {
    return (
      <Badge variant="secondary" className={size === "sm" ? "text-xs" : ""}>
        {status || "알 수 없음"}
      </Badge>
    );
  }
  
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={size === "sm" ? "text-xs" : ""}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

// 처리 상태 Badge
export function ProcessStatusBadge({ status, showIcon = false, size = "default" }: ProcessStatusBadgeProps) {
  const config = processStatusConfig[status];
  
  // 안전한 처리: config가 없으면 기본값 사용
  if (!config) {
    return (
      <Badge variant="secondary" className={size === "sm" ? "text-xs" : ""}>
        {status || "알 수 없음"}
      </Badge>
    );
  }
  
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${size === "sm" ? "text-xs" : ""} ${showIcon ? "flex w-fit items-center gap-1" : ""}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

// 설정값 export (통계 등에서 사용)
export { adminStatusConfig, processStatusConfig };
