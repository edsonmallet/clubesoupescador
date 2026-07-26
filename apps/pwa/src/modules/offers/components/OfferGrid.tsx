'use client'

import { Skeleton } from '@clube/ui'
import { useOffers } from '../hooks/useOffers'
import { OfferCard } from './OfferCard'

export function OfferGrid() {
  const { data, isLoading } = useOffers()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count, no reordering
          <Skeleton key={index} className="aspect-[3/4] w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {data?.items.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  )
}
