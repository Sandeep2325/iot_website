import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Native <select> styled to match Input. */
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="h-9 w-full cursor-pointer appearance-none rounded-lg border bg-card pr-8 pl-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
