'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'

import { cn } from '@/lib/utils'

/**
 * FormLabel
 * 폼 필드(인풋/셀렉트/텍스트에리아)에 붙는 라벨의 font-size와 font-weight를
 * 일관되게 적용하기 위한 공통 컴포넌트.
 *
 * - font-size: text-sm
 * - font-weight: font-medium
 *
 * 색상/간격/레이아웃 등 나머지 스타일은 일절 주입하지 않으며,
 * 전달받은 className 으로만 제어한다. (font-size/font-weight 만 통일)
 */
function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="form-label"
      className={cn(
        'text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
}

export { FormLabel }
