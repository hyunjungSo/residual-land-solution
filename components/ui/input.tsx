import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 중장년층 접근성: 높이 48px (h-12), 폰트 16px (text-base)
        'flex h-12 w-full rounded-md border border-gray-300 bg-background px-4 py-3 text-base ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-[#8A949E] hover:border-gray-400 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
