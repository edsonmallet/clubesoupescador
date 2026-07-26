'use client'

import { useQuery } from '@tanstack/react-query'
import { subscriptionsService } from '../services/subscriptions.service'

export function useMySubscription(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsService.getMySubscription(),
    enabled: options?.enabled ?? true,
  })
}
