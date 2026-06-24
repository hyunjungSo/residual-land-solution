"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, PlayCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AdminStatus, ProcessStatus } from "@/lib/types";

// 담당자 진행상황 - 새 흐름 적용
const adminStatusConfig: Record<AdminStatus, {
  label: string;
  icon: typeof Clock;
  variant: "outline-indigo" | "outline-blue" | "outline-green" | "outline-purple" | "outline-amber";
}> = {
  접수완료: {
    label: "접수 완료",
    icon: Clock,
    variant: "outline-indigo",
  },
  담당자검토중: {
    label: "담당자 검토 중",
    icon: PlayCircle,
    variant: "outline-blue",
  },
  담당자검토완료: {
    label: "민원 종결처리",
    icon: CheckCircle2,
    variant: "outline-green",
  },
  심의위원회회부: {
    label: "심의위원회 회부",
    icon: AlertTriangle,
    variant: "outline-purple",
  },
  심의위원회검토중: {
    label: "심의위원회 검토 중",
    icon: PlayCircle,
    variant: "outline-purple",
  },
  심의위원회검토완료: {
    label: "심의위원회 검토 완료",
    icon: CheckCircle2,
    variant: "outline-purple",
  },
  심사완료: {
    label: "민원 종결처리",
    icon: CheckCircle2,
    variant: "outline-green",
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
