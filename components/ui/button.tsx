import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // KRDS 버튼 디자인 시스템 준수 - 중장년층 접근성 강화
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        // KRDS Primary: 채운 스타일 - 가장 높은 강조, 주요 행동 유도
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        // KRDS Secondary: 채운 스타일 - 중간 수준 강조, 검색/조회 등 보조 액션
        secondary: 'bg-[#222222] text-white hover:bg-[#333333] active:bg-[#111111]',
        // KRDS Outline: 윤곽선 스타일 - 중간 수준 강조
        outline: 'border-2 border-primary bg-transparent text-primary hover:bg-primary/5 active:bg-primary/10',
        // KRDS Tertiary: 낮은 강조 수준
        tertiary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
        // KRDS Text: 텍스트 버튼 - 가장 낮은 강조
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200',
        // 위험 동작용
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
        // 링크 스타일
        link: 'text-primary underline-offset-4 hover:underline',
        // CTA Primary: 주요 액션 버튼 (녹색 채움)
        cta: 'bg-[#2E8B57] text-white hover:bg-[#25704a] active:bg-[#1e5c3d]',
        // CTA Outline: 보조 액션 버튼 (녹색 윤곽선)
        'cta-outline': 'border border-[#2E8B57] bg-transparent text-[#2E8B57] hover:bg-[#2E8B57] hover:text-white active:bg-[#25704a]',
      },
      size: {
        // 중장년층 접근성: 최소 터치 타겟 48px, 폰트 사이즈 증가
        xs: 'h-9 px-3 text-sm rounded',
        sm: 'h-10 px-4 text-sm rounded-md',
        default: 'h-12 px-5 text-base rounded-md',
        lg: 'h-14 px-6 text-lg rounded-md',
        xl: 'h-16 px-8 text-xl rounded-md',
        // 아이콘 버튼 - 최소 48px
        icon: 'h-12 w-12',
        'icon-xs': 'h-9 w-9',
        'icon-sm': 'h-10 w-10',
        'icon-lg': 'h-14 w-14',
        'icon-xl': 'h-16 w-16',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
