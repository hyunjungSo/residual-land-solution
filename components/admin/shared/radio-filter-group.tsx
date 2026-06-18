"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ReactNode } from "react";

export interface RadioFilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
  className?: string;
}

interface RadioFilterGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioFilterOption[];
  name: string;
}

export function RadioFilterGroup({ 
  label, 
  value, 
  onChange, 
  options,
  name
}: RadioFilterGroupProps) {
  return (
    <div className="flex items-center gap-3">
      <Label className="text-[15px] font-medium whitespace-nowrap">{label}:</Label>
      <div className="flex items-center gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 h-[40px] text-[15px] font-medium transition-all ${
              value === option.value
                ? "bg-black text-white hover:bg-black/90"
                : "border border-black text-black hover:bg-black/5"
            } ${option.className || ""}`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
