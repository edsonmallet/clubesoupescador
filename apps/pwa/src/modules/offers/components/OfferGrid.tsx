'use client'

import { EmptyState, SkeletonList } from '@clube/ui'
import { useOffers } from '../hooks/useOffers'
import { OfferCard } from './OfferCard'

export function OfferGrid({ query = '' }: { query?: string }) {
  const { data, isLoading } = useOffers()

  if (isLoading) {
    return (
      <SkeletonList
        count={8}
        containerClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        itemClassName="aspect-[3/4] w-full"
      />
    )
  }

  const normalizedQuery = query.trim().toLowerCase()
  const items = (data?.items ?? []).filter(
    (offer) =>
      !normalizedQuery || offer.name.toLowerCase().includes(normalizedQuery),
  )

  if (items.length === 0) {
    return <EmptyState message="Nenhuma oferta encontrada." />
  }

  return (
    <div className="grid animate-fade-in grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  )
}
