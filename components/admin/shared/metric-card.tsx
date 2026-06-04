"use client";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * 지표 카드 컴포넌트
 * 잔여지 형상지수, 최소폭, 잔여면적 등 수치 지표 표시
 */
export function MetricCard({ 
  label, 
  value, 
  unit = "",
  className = "",
  size = "md"
}: MetricCardProps) {
  const sizeClasses = {
    sm: { label: "text-xs text-[rgb(102,102,102)]", value: "text-base font-semibold text-[rgb(26,26,26)]" },
    md: { label: "text-xs text-[rgb(102,102,102)]", value: "text-lg font-semibold text-[rgb(26,26,26)]" },
    lg: { label: "text-sm text-[rgb(102,102,102)]", value: "text-xl font-bold text-[rgb(26,26,26)]" }
  };

  return (
    <div 
      className={`p-2 rounded ${className}`} 
      style={{ backgroundColor: "rgb(251, 251, 251)" }}
    >
      <p className={sizeClasses[size].label}>{label}</p>
      <p className={sizeClasses[size].value}>
        {value}{unit}
      </p>
    </div>
  );
}

interface MetricGridProps {
  metrics: Array<{
    label: string;
    value: string | number | undefined | null;
    unit?: string;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * 지표 그리드 컴포넌트
 * 여러 지표를 그리드 형태로 표시
 */
export function MetricGrid({ 
  metrics, 
  columns = 3,
  className = "",
  size = "md"
}: MetricGridProps) {
  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4"
  };

  return (
    <div className={`grid ${colClasses[columns]} gap-3 ${className}`}>
      {metrics.map((metric, idx) => (
        <MetricCard
          key={idx}
          label={metric.label}
          value={metric.value ?? "-"}
          unit={metric.unit}
          size={size}
        />
      ))}
    </div>
  );
}

// 유틸리티: AI 결과에서 지표 배열 생성
export function createAIMetrics(aiResult: {
  remainingShapeIndex?: number;
  remainingMinWidth?: number;
  remainingArea?: number;
}): Array<{ label: string; value: string | number | undefined; unit?: string }> {
  return [
    { 
      label: "잔여지 형상지수", 
      value: aiResult.remainingShapeIndex?.toFixed(3) 
    },
    { 
      label: "최소폭", 
      value: aiResult.remainingMinWidth, 
      unit: "m" 
    },
    { 
      label: "잔여면적", 
      value: aiResult.remainingArea?.toLocaleString(), 
      unit: "㎡" 
    },
  ];
}
