"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const SITE_INSPECTION_OPTIONS = [
  { id: "farmMachineDifficulty", label: "농기계 회전 곤란" },
  { id: "accessRoadLost", label: "접면도로 상실" },
  { id: "waterChannelLost", label: "관개수로 상실" },
] as const;

export type SiteInspectionKey = typeof SITE_INSPECTION_OPTIONS[number]["id"];

export interface SiteInspectionValues {
  farmMachineDifficulty?: boolean;
  accessRoadLost?: boolean;
  waterChannelLost?: boolean;
}

interface SiteInspectionCheckboxGroupProps {
  values: SiteInspectionValues;
  onChange: (key: SiteInspectionKey, value: boolean) => void;
  disabled?: boolean;
  showLabel?: boolean;
  labelText?: string;
}

export function SiteInspectionCheckboxGroup({
  values,
  onChange,
  disabled = false,
  showLabel = true,
  labelText = "현장 확인 항목",
}: SiteInspectionCheckboxGroupProps) {
  return (
    <div className="space-y-3">
      {showLabel && (
        <label className="text-sm font-medium text-foreground">{labelText}</label>
      )}
      <div className="space-y-3">
        {SITE_INSPECTION_OPTIONS.map((option) => (
          <div key={option.id} className="flex items-center space-x-3">
            <Checkbox
              id={option.id}
              checked={values[option.id] ?? false}
              onCheckedChange={(checked) => onChange(option.id, checked === true)}
              disabled={disabled}
            />
            <Label
              htmlFor={option.id}
              className={`text-sm ${disabled ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer"}`}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SiteInspectionDisplayProps {
  values: SiteInspectionValues;
  emptyText?: string;
}

export function SiteInspectionDisplay({ values, emptyText = "해당 없음" }: SiteInspectionDisplayProps) {
  const checkedItems = SITE_INSPECTION_OPTIONS.filter(option => values[option.id]);
  
  if (checkedItems.length === 0) {
    return <span className="text-muted-foreground">{emptyText}</span>;
  }
  
  return (
    <span>
      {checkedItems.map(item => item.label).join(", ")}
    </span>
  );
}

export function getSiteInspectionLabels(values: SiteInspectionValues): string[] {
  return SITE_INSPECTION_OPTIONS
    .filter(option => values[option.id])
    .map(option => option.label);
}
