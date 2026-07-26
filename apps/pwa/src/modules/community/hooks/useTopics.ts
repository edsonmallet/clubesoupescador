'use client'

import type { TopicSort } from '@clube/shared-types'
import { useQuery } from '@tanstack/react-query'
import { communityService } from '../services/community.service'

export function useTopics(
  categoryId: string | null,
  sort: TopicSort,
  page = 1,
) {
  return useQuery({
    queryKey: ['community-topics', categoryId, sort, page],
    queryFn: () => communityService.listTopics(categoryId, sort, page),
  })
}
