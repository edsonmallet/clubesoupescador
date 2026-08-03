import { cn } from '@clube/ui'
import Image from 'next/image'

const BADGE_SIZES = {
  sm: 96,
  md: 140,
  lg: 220,
} as const

const ICON_SIZES = {
  sm: 48,
  md: 56,
  lg: 72,
} as const

const TEXT_SIZES = {
  sm: 'text-2xl',
  md: 'text-2xl',
  lg: 'text-3xl',
} as const

const SUB_SIZES = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
} as const

export function Logo({
  size = 'md',
  variant = 'badge',
  className = '',
}: {
  size?: keyof typeof BADGE_SIZES
  variant?: 'badge' | 'compact'
  className?: string
}) {
  if (variant === 'compact') {
    const iconPx = ICON_SIZES[size]

    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <Image
          src="/app-icon-mark.png"
          alt="Anzol Club"
          width={iconPx}
          height={iconPx}
          className="rounded-xl"
          priority
        />
        <div className="flex flex-col items-center leading-none">
          <span
            className={`font-heading text-brand-sand ${TEXT_SIZES[size]} tracking-wide`}
          >
            ANZOL
          </span>
          <span
            className={`font-heading text-brand-rust ${SUB_SIZES[size]} tracking-[0.35em]`}
          >
            CLUB
          </span>
        </div>
      </div>
    )
  }

  const px = BADGE_SIZES[size]

  return (
    <Image
      src="/logo-badge.png"
      alt="Anzol Club"
      width={px}
      height={px}
      className={cn('rounded-full', className)}
      priority
    />
  )
}
