'use client'

import { BellIcon, SearchIcon } from '@/shared/components/icons'
import { Input } from '@clube/ui'
import Image from 'next/image'

export function PageHeader({
  logoSrc,
  logoAlt,
  logoWidth,
  logoHeight,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: {
  logoSrc: string
  logoAlt: string
  logoWidth: number
  logoHeight: number
  subtitle: string
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
}) {
  return (
    <>
      <div className="bg-brand-dark">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={logoWidth}
              height={logoHeight}
              className="h-14 w-auto"
              priority
            />
            <div className="relative">
              <BellIcon width={22} height={22} className="text-brand-sand" />
              {/* TODO: contador real de notificações não lidas */}
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-brand-dark bg-brand-rust" />
            </div>
          </div>
          <p className="text-sm text-brand-sand/80">{subtitle}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pt-4 md:px-8 lg:px-12">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="bg-white pl-9"
          />
        </div>
      </div>
    </>
  )
}
