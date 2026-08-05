'use client'

import { Skeleton } from '@clube/ui'
import { useRaffles } from '../hooks/useRaffles'
import { RaffleCard } from './RaffleCard'

export function RaffleGrid({ query = '' }: { query?: string }) {
  const { data, isLoading } = useRaffles()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count, no reordering
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const normalizedQuery = query.trim().toLowerCase()
  const items = (data?.items ?? []).filter(
    (raffle) =>
      !normalizedQuery ||
      raffle.title.toLowerCase().includes(normalizedQuery) ||
      raffle.prize.toLowerCase().includes(normalizedQuery),
  )

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-brand-ink/60">
        Nenhum sorteio encontrado.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((raffle) => (
        <RaffleCard key={raffle.id} raffle={raffle} />
      ))}
    </div>
  )
}
