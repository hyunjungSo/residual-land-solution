import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // KRDS 텍스트영역 스타일: 폰트 16px, 보더 1px
        'flex min-h-[120px] w-full rounded-md border border-gray-300 bg-background px-4 py-3 text-base ring-offset-background transition-colors placeholder:text-[#8A949E] hover:border-gray-400 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
