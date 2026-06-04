"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// 현재 활용 지목 옵션
export const LAND_USAGE_OPTIONS = [
  { value: "대", label: "대(택지)" },
  { value: "전", label: "전(밭)" },
  { value: "답", label: "답(논)" },
  { value: "임", label: "임(임야)" },
  { value: "잡", label: "그밖의 토지" },
] as const

export type LandUsageValue = typeof LAND_USAGE_OPTIONS[number]["value"]

interface LandUsageSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

export function LandUsageSelect({
  value,
  onValueChange,
  disabled = false,
  className,
  triggerClassName = "h-10 bg-background",
}: LandUsageSelectProps) {
  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder="현재 활용 지목을 선택해 주세요" />
      </SelectTrigger>
      <SelectContent className={className}>
        {LAND_USAGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// 값으로 라벨 가져오기 유틸 함수
export function getLandUsageLabel(value: string | undefined): string {
  if (!value) return "-"
  const option = LAND_USAGE_OPTIONS.find((opt) => opt.value === value)
  return option?.label || value
}

// 읽기 전용 표시 컴포넌트
interface LandUsageDisplayProps {
  value?: string
  className?: string
}

export function LandUsageDisplay({ value, className = "" }: LandUsageDisplayProps) {
  return (
    <div className={`h-10 px-3 py-2 border rounded-md bg-muted/30 flex items-center text-sm ${className}`}>
      {value ? getLandUsageLabel(value) : <span className="text-muted-foreground">선택되지 않음</span>}
    </div>
  )
}
