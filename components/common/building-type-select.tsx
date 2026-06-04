"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const BUILDING_TYPE_OPTIONS = [
  { value: "residential-detached", label: "주거용 - 단독주택 (기준: 90㎡)" },
  { value: "residential-multi", label: "주거용 - 연립/다세대 (기준: 165㎡)" },
  { value: "residential-apartment", label: "주거용 - 아파트 (기준: 60㎡)" },
  { value: "commercial", label: "상업용 (기준: 150㎡)" },
  { value: "industrial", label: "공업용 (기준: 330㎡)" },
] as const;

export type BuildingTypeValue = typeof BUILDING_TYPE_OPTIONS[number]["value"] | "";

interface BuildingTypeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function BuildingTypeSelect({
  value,
  onValueChange,
  placeholder = "건축물 용도를 선택해 주세요",
  triggerClassName = "h-10 bg-background",
  disabled = false,
}: BuildingTypeSelectProps) {
  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {BUILDING_TYPE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface BuildingTypeDisplayProps {
  value?: string;
  className?: string;
}

export function BuildingTypeDisplay({ value, className = "h-10 px-3 py-2 border rounded-md bg-muted/30 flex items-center text-sm" }: BuildingTypeDisplayProps) {
  const label = value ? BUILDING_TYPE_OPTIONS.find(o => o.value === value)?.label : null;
  
  return (
    <div className={className}>
      {label || <span className="text-muted-foreground">선택되지 않음</span>}
    </div>
  );
}

export function getBuildingTypeLabel(value?: string): string {
  if (!value) return "-";
  const option = BUILDING_TYPE_OPTIONS.find(o => o.value === value);
  return option?.label || value;
}
