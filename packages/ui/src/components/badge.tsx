import type { HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export type BadgeProps = HTMLAttributes<HTMLSpanElement>

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold',
        className,
      )}
      {...props}
    />
  )
}
