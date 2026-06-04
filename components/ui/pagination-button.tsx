"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PaginationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export function PaginationButton({
  isActive = false,
  className,
  children,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      className={cn(
        "w-9 h-9 flex items-center justify-center text-sm rounded transition-colors",
        isActive
          ? "bg-[#2E8B57] text-white"
          : "text-gray-600 hover:bg-gray-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface PaginationNavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function PaginationNavButton({
  className,
  children,
  ...props
}: PaginationNavButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 text-sm text-gray-600 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
