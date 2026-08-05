'use client'

import { Skeleton } from '@clube/ui'
import { useOffers } from '../hooks/useOffers'
import { OfferCard } from './OfferCard'

export function OfferGrid({ query = '' }: { query?: string }) {
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

  const normalizedQuery = query.trim().toLowerCase()
  const items = (data?.items ?? []).filter(
    (offer) =>
      !normalizedQuery || offer.name.toLowerCase().includes(normalizedQuery),
  )

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-brand-ink/60">
        Nenhuma oferta encontrada.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  )
}
