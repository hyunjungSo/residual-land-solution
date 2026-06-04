"use client";

import * as React from "react";
import { ChevronRight, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export type PeriodFilterType = "year" | "today" | "week" | "month" | "custom";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface PeriodFilterProps {
  value: PeriodFilterType;
  onChange: (period: PeriodFilterType, year?: number) => void;
  selectedYear: number | null;
  customDateRange: DateRange;
  onCustomDateChange: (range: DateRange) => void;
  label?: string;
  availableYears?: number[];
  className?: string;
}

const currentYear = new Date().getFullYear();
const defaultYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

export function PeriodFilter({
  value,
  onChange,
  selectedYear,
  customDateRange,
  onCustomDateChange,
  label = "조회 기간:",
  availableYears = defaultYears,
  className,
}: PeriodFilterProps) {
  const periodOptions = [
    { value: "today" as const, label: "오늘" },
    { value: "week" as const, label: "이번 주" },
    { value: "month" as const, label: "이번 달" },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex items-center gap-1">
        {/* 연도 피커 */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                value === "year" && selectedYear !== null
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
              )}
            >
              {selectedYear !== null ? `${selectedYear}년` : "년도선택"}
              <ChevronRight className="h-3 w-3 rotate-90" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-1" align="start">
            <div className="max-h-48 overflow-y-auto">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => onChange("year", year)}
                  className={cn(
                    "w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                    selectedYear === year && value === "year"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {year}년
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* 기간 버튼들 */}
        {periodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
              value === option.value
                ? "border-primary bg-primary/5 text-primary"
                : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}

        {/* 직접선택 */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                value === "custom"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              직접선택
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={{ from: customDateRange.from, to: customDateRange.to }}
              onSelect={(range) => {
                onCustomDateChange({ from: range?.from, to: range?.to });
                if (range?.from) {
                  onChange("custom");
                }
              }}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
