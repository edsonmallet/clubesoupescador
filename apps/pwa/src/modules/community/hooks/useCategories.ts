'use client'

import { useQuery } from '@tanstack/react-query'
import { communityService } from '../services/community.service'

export function useCategories() {
  return useQuery({
    queryKey: ['community-categories'],
    queryFn: () => communityService.listCategories(),
    staleTime: 1000 * 60 * 5,
  })
}
