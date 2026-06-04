"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  unit?: string;
  onClick?: () => void;
  isActive?: boolean;
  variant?: "default" | "primary" | "sky" | "slate" | "slate-deep";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles = {
  default: {
    container: "bg-slate-50",
    label: "text-slate-600",
    value: "text-foreground",
    unit: "text-foreground",
  },
  primary: {
    container: "bg-primary/5",
    label: "text-primary",
    value: "text-primary",
    unit: "text-primary",
  },
  sky: {
    container: "bg-sky-50",
    label: "text-sky-600",
    value: "text-sky-500",
    unit: "text-sky-500",
  },
  slate: {
    container: "bg-slate-50",
    label: "text-slate-600",
    value: "text-slate-500",
    unit: "text-slate-500",
  },
  "slate-deep": {
    container: "bg-slate-100",
    label: "text-slate-700",
    value: "text-slate-700",
    unit: "text-slate-700",
  },
};

const sizeStyles = {
  sm: {
    padding: "p-2",
    labelSize: "text-xs",
    valueSize: "text-xl",
    unitSize: "text-xs",
  },
  md: {
    padding: "p-3",
    labelSize: "text-sm",
    valueSize: "text-[38px]",
    unitSize: "text-sm",
  },
  lg: {
    padding: "p-4",
    labelSize: "text-base",
    valueSize: "text-5xl",
    unitSize: "text-base",
  },
};

export function StatCard({
  label,
  value,
  unit = "건",
  onClick,
  isActive = false,
  variant = "default",
  size = "md",
  className,
}: StatCardProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col items-center rounded-lg transition-opacity",
        variantStyle.container,
        sizeStyle.padding,
        onClick && "cursor-pointer hover:opacity-80",
        isActive && "ring-2 ring-primary",
        className
      )}
    >
      <span
        className={cn("font-medium", variantStyle.label, sizeStyle.labelSize)}
        style={{ order: 1 }}
      >
        {label}
      </span>
      <div className="mt-2 flex items-baseline gap-1" style={{ order: 2 }}>
        <span
          className={cn("font-bold", variantStyle.value)}
          style={{ fontSize: size === "md" ? "38px" : undefined }}
        >
          {value}
        </span>
        <span
          className={cn("font-medium", variantStyle.unit, sizeStyle.unitSize)}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

// 통계 카드 그룹
interface StatCardGroupProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function StatCardGroup({
  children,
  columns = 4,
  className,
}: StatCardGroupProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {children}
    </div>
  );
}
