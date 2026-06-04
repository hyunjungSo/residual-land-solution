"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

// KRDS Search Component - Size variants
type SearchSize = "sm" | "md" | "lg" | "xl"

// KRDS Search Component - State variants
type SearchState = "default" | "focused" | "completed" | "error"

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: SearchSize
  state?: SearchState
  label?: string
  helperText?: string
  errorText?: string
  showAdvancedSearch?: boolean
  onAdvancedSearch?: () => void
  onClear?: () => void
  showClearButton?: boolean
}

const sizeStyles: Record<SearchSize, string> = {
  sm: "h-8 text-sm px-3", // 32px
  md: "h-10 text-sm px-4", // 40px
  lg: "h-11 text-base px-4", // 44px
  xl: "h-12 text-base px-4", // 48px
}

const iconSizeStyles: Record<SearchSize, string> = {
  sm: "h-4 w-4",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-5 w-5",
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      size = "md",
      state = "default",
      label,
      helperText,
      errorText,
      showAdvancedSearch = false,
      onAdvancedSearch,
      onClear,
      showClearButton = false,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const hasValue = value !== undefined && value !== ""
    
    const currentState = isFocused ? "focused" : state

    const stateStyles: Record<SearchState, string> = {
      default: "border-border hover:border-gray-400",
      focused: "border-primary ring-2 ring-primary/20",
      completed: "border-success",
      error: "border-destructive",
    }

    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-2">
          {label && (
            <label className="text-sm font-medium text-foreground">
              {label}
            </label>
          )}
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="text"
              value={value}
              className={cn(
                "w-full rounded border bg-background pr-10 transition-all",
                "placeholder:text-muted-foreground",
                "focus:outline-none",
                "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
                sizeStyles[size],
                stateStyles[currentState],
                className
              )}
              onFocus={(e) => {
                setIsFocused(true)
                props.onFocus?.(e)
              }}
              onBlur={(e) => {
                setIsFocused(false)
                props.onBlur?.(e)
              }}
              {...props}
            />
            
            {/* Clear button or Search icon */}
            <div className="absolute right-3 flex items-center gap-1">
              {showClearButton && hasValue && (
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className={iconSizeStyles[size]} />
                </button>
              )}
              <Search className={cn(iconSizeStyles[size], "text-muted-foreground")} />
            </div>
          </div>
          
          {/* Helper/Error text */}
          {(helperText || errorText) && (
            <p className={cn(
              "text-xs",
              currentState === "error" ? "text-destructive" : "text-muted-foreground"
            )}>
              {currentState === "error" ? errorText : helperText}
            </p>
          )}
        </div>
        
        {/* Advanced search link */}
        {showAdvancedSearch && (
          <button
            type="button"
            onClick={onAdvancedSearch}
            className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span>고급검색</span>
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

// KRDS XLarge Search with dropdown
interface SearchWithSelectProps extends SearchInputProps {
  selectValue?: string
  selectOptions?: { value: string; label: string }[]
  onSelectChange?: (value: string) => void
  selectPlaceholder?: string
}

const SearchWithSelect = React.forwardRef<HTMLInputElement, SearchWithSelectProps>(
  (
    {
      selectValue,
      selectOptions = [],
      onSelectChange,
      selectPlaceholder = "전체",
      size = "xl",
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-2">
          {props.label && (
            <label className="text-sm font-medium text-foreground">
              {props.label}
            </label>
          )}
          <div className="flex overflow-hidden rounded border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            {/* Select dropdown */}
            <select
              value={selectValue}
              onChange={(e) => onSelectChange?.(e.target.value)}
              className={cn(
                "border-r border-border bg-transparent px-3 text-sm focus:outline-none",
                sizeStyles[size].replace(/px-\d+/, "")
              )}
            >
              <option value="">{selectPlaceholder}</option>
              {selectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Search input */}
            <div className="relative flex flex-1 items-center">
              <input
                ref={ref}
                type="text"
                className={cn(
                  "w-full border-0 bg-transparent pr-10 focus:outline-none",
                  "placeholder:text-muted-foreground",
                  sizeStyles[size]
                )}
                {...props}
              />
              <Search className={cn("absolute right-3", iconSizeStyles[size], "text-muted-foreground")} />
            </div>
          </div>
        </div>
        
        {/* Advanced search link */}
        {props.showAdvancedSearch && (
          <button
            type="button"
            onClick={props.onAdvancedSearch}
            className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span>고급검색</span>
          </button>
        )}
      </div>
    )
  }
)
SearchWithSelect.displayName = "SearchWithSelect"

export { SearchInput, SearchWithSelect }
export type { SearchSize, SearchState, SearchInputProps, SearchWithSelectProps }
