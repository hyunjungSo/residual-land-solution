"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { landShapes } from "@/lib/dummy-data";

export const LAND_SHAPE_OPTIONS = {
  regular: landShapes.regular,
  irregular: landShapes.irregular,
};

interface LandShapeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function LandShapeSelect({
  value,
  onValueChange,
  placeholder = "토지 모양을 선택해 주세요",
  triggerClassName = "h-10 bg-background",
  disabled = false,
}: LandShapeSelectProps) {
  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">정형</div>
        {LAND_SHAPE_OPTIONS.regular.map((shape) => (
          <SelectItem key={shape.value} value={shape.value}>
            {shape.label}
          </SelectItem>
        ))}
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">비정형</div>
        {LAND_SHAPE_OPTIONS.irregular.map((shape) => (
          <SelectItem key={shape.value} value={shape.value}>
            {shape.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface LandShapeDisplayProps {
  value?: string;
  className?: string;
}

export function LandShapeDisplay({ value, className = "h-10 px-3 py-2 border rounded-md bg-muted/30 flex items-center text-sm" }: LandShapeDisplayProps) {
  const label = value 
    ? [...LAND_SHAPE_OPTIONS.regular, ...LAND_SHAPE_OPTIONS.irregular].find(s => s.value === value)?.label 
    : null;
  
  return (
    <div className={className}>
      {label || <span className="text-muted-foreground">선택되지 않음</span>}
    </div>
  );
}

export function getLandShapeLabel(value?: string): string {
  if (!value) return "-";
  const shape = [...LAND_SHAPE_OPTIONS.regular, ...LAND_SHAPE_OPTIONS.irregular].find(s => s.value === value);
  return shape?.label || value;
}
