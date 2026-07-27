'use client'

import { useQuery } from '@tanstack/react-query'
import { plansService } from '../services/plans.service'

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => plansService.list(),
  })
}
