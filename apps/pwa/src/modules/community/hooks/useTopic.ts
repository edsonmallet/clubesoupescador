'use client'

import { useQuery } from '@tanstack/react-query'
import { communityService } from '../services/community.service'

export function useTopic(id: string) {
  return useQuery({
    queryKey: ['community-topic', id],
    queryFn: () => communityService.getTopic(id),
  })
}
