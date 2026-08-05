'use client'

import { ArrowLeftIcon } from '@/shared/components/icons'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

export function DetailBackHeader({
  title,
  trailing,
}: {
  title: string
  trailing?: ReactNode
}) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Voltar"
        className="text-brand-ink"
      >
        <ArrowLeftIcon width={22} height={22} />
      </button>
      <span className="flex-1 text-sm text-brand-ink/70">{title}</span>
      {trailing}
    </div>
  )
}
