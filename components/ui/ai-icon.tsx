"use client";

import { cn } from "@/lib/utils";

interface AIIconProps {
  className?: string;
}

export function AIIcon({ className }: AIIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4", className)}
    >
      {/* 4-pointed star shape similar to Gemini */}
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="currentColor"
      />
      <path
        d="M18 14L18.75 16.25L21 17L18.75 17.75L18 20L17.25 17.75L15 17L17.25 16.25L18 14Z"
        fill="currentColor"
      />
      <path
        d="M6 14L6.5 15.5L8 16L6.5 16.5L6 18L5.5 16.5L4 16L5.5 15.5L6 14Z"
        fill="currentColor"
      />
    </svg>
  );
}
