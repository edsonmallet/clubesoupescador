'use client'

import { useQuery } from '@tanstack/react-query'
import { subscriptionsService } from '../services/subscriptions.service'

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionsService.listPlans(),
    staleTime: 1000 * 60 * 5,
  })
}
