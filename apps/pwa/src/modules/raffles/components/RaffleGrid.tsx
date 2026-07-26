'use client'

import { Skeleton } from '@clube/ui'
import { useRaffles } from '../hooks/useRaffles'
import { RaffleCard } from './RaffleCard'

export function RaffleGrid() {
  const { data, isLoading } = useRaffles()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count, no reordering
          <Skeleton key={index} className="aspect-[4/5] w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {data?.items.map((raffle) => (
        <RaffleCard key={raffle.id} raffle={raffle} />
      ))}
    </div>
  )
}
