'use client'

import type { TopicSort } from '@clube/shared-types'
import { Skeleton } from '@clube/ui'
import { useState } from 'react'
import { useTopics } from '../hooks/useTopics'
import { TopicCard } from './TopicCard'

const TABS: { value: TopicSort; label: string }[] = [
  { value: 'hot', label: 'Quente' },
  { value: 'new', label: 'Novo' },
  { value: 'top', label: 'Top' },
  { value: 'rising', label: 'Subindo' },
]

export function TopicFeed({
  categoryId = null,
}: { categoryId?: string | null }) {
  const [sort, setSort] = useState<TopicSort>('hot')
  const { data, isLoading } = useTopics(categoryId, sort)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-brand-ink/15 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSort(tab.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              sort === tab.value
                ? 'bg-brand-dark text-white'
                : 'text-brand-ink/80 hover:bg-brand-sand/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count, no reordering
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data?.items.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  )
}
