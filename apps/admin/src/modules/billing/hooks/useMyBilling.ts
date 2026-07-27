'use client'

import { useQuery } from '@tanstack/react-query'
import { billingService } from '../services/billing.service'

export function useMyBilling() {
  return useQuery({
    queryKey: ['my-billing'],
    queryFn: () => billingService.getMyBilling(),
  })
}
