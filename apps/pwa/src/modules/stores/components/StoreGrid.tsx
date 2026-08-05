'use client'

import { EmptyState, SkeletonList } from '@clube/ui'
import { useStores } from '../hooks/useStores'
import { StoreCard } from './StoreCard'

export function StoreGrid({ query = '' }: { query?: string }) {
  const { data, isLoading } = useStores()

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
  const items = (data ?? []).filter(
    (store) =>
      !normalizedQuery ||
      store.name.toLowerCase().includes(normalizedQuery) ||
      store.category.toLowerCase().includes(normalizedQuery),
  )

  if (items.length === 0) {
    return <EmptyState message="Nenhuma loja encontrada." />
  }

  return (
    <div className="flex animate-fade-in flex-col gap-4">
      {items.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  )
}
