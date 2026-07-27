'use client'

import { useQuery } from '@tanstack/react-query'
import { billingService } from '../services/billing.service'

export function usePlans() {
  return useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => billingService.listPlans(),
  })
}
