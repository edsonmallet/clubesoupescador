'use client'

import { EmptyState, SkeletonList } from '@clube/ui'
import { useRaffles } from '../hooks/useRaffles'
import { RaffleCard } from './RaffleCard'

export function RaffleGrid({ query = '' }: { query?: string }) {
  const { data, isLoading } = useRaffles()

  if (isLoading) {
    return (
      <SkeletonList
        count={4}
        containerClassName="flex flex-col gap-3"
        itemClassName="h-24 w-full rounded-lg"
      />
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
    return <EmptyState message="Nenhum sorteio encontrado." />
  }

  return (
    <div className="flex animate-fade-in flex-col gap-4">
      {items.map((raffle) => (
        <RaffleCard key={raffle.id} raffle={raffle} />
      ))}
    </div>
  )
}
