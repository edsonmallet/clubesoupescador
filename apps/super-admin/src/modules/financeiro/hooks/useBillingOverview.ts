'use client'

import { useQuery } from '@tanstack/react-query'
import { financeiroService } from '../services/financeiro.service'

export function useBillingOverview() {
  return useQuery({
    queryKey: ['billing-overview'],
    queryFn: () => financeiroService.getOverview(),
  })
}
