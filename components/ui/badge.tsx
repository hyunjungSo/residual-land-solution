import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  // KRDS v1.0.0 뱃지 스타일: 4px radius, 8px 단위 padding
  'inline-flex items-center justify-center rounded gap-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // KRDS Primary Filled - #157161
        default:
          'border-transparent bg-primary text-primary-foreground',
        // KRDS Secondary/Subtle - 연한 배경
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        // KRDS Destructive/Error - #D32F2F
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        // KRDS Outline - 테두리만
        outline: 'border border-border bg-transparent text-foreground',
        // KRDS Success Filled - #2E7D32
        success: 'border-transparent bg-success text-success-foreground',
        // KRDS Warning Filled - #ED6C02
        warning: 'border-transparent bg-warning text-warning-foreground',
        // KRDS Info Filled - #0288D1
        info: 'border-transparent bg-info text-info-foreground',
        // KRDS Primary Solid-Pastel
        'primary-subtle': 'border-transparent bg-accent text-primary',
        // KRDS Success Solid-Pastel - 연한 녹색 배경 + 녹색 텍스트
        'success-subtle': 'border-transparent bg-emerald-50 text-emerald-700',
        // KRDS Warning Solid-Pastel - 연한 주황 배경 + 주황 텍스트
        'warning-subtle': 'border-transparent bg-amber-50 text-amber-700',
        // KRDS Info Solid-Pastel - 연한 파랑 배경 + 파랑 텍스트
        'info-subtle': 'border-transparent bg-sky-50 text-sky-700',
        // KRDS Destructive Solid-Pastel
        'destructive-subtle': 'border-transparent bg-red-100 text-red-700',
        // Purple Solid-Pastel - 연한 보라색 배경 + 보라색 텍스트
        'purple-subtle': 'border-transparent bg-purple-50 text-purple-700',
        
        // === 진행상황 Outline 스타일 (새 컬러 시스템) ===
        // 접수완료: Indigo #6366F1 (신규 접수 강조)
        'outline-indigo': 'border-0 bg-indigo-50 text-indigo-500',
        // 진행중: #0091fd (활동 상태 강조)
        'outline-blue': 'border-0 bg-[#e6f4ff] text-[#0091fd]',
        // 심사완료: Green (완료 상태 강조)
        'outline-green': 'border-0 bg-green-50 text-green-600',
        // 심의위원회: Purple (심의 단계 강조)
        'outline-purple': 'border-0 bg-purple-50 text-purple-600',
        // 주의: Amber (경고 단계 강조)
        'outline-amber': 'border-0 bg-amber-50 text-amber-600',
        
        // === 진행상황 Outline 스타일 (레거시 - 호환성 유지) ===
        // 접수완료: Slate Gray (#64748b)
        'outline-slate': 'border border-slate-400 bg-transparent text-slate-500',
        // 진행중: Sky Blue (#0ea5e9)
        'outline-sky': 'border border-sky-500 bg-transparent text-sky-500',
        // 심사완료: Slate Deep (#334155)
        'outline-slate-deep': 'border border-slate-700 bg-transparent text-slate-700',
        
        // === 심사결과 Solid 스타일 ===
        // 보상: Emerald (#10b981)
        'solid-emerald': 'border-transparent bg-emerald-500 text-white',
        // 기각: Rose (#f43f5e)
        'solid-rose': 'border-transparent bg-rose-500 text-white',
        // 심사위원회 이관: Amber (#f59e0b)
        'solid-amber': 'border-transparent bg-amber-500 text-white',
      },
      size: {
        // KRDS 뱃지 크기 (8px 단위)
        sm: 'h-5 px-1.5 text-xs', // 20px height
        default: 'h-6 px-2 text-xs', // 24px height - medium
        lg: 'h-7 px-2.5 text-sm', // 28px height
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
