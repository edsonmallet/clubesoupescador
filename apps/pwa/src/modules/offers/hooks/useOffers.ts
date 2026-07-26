'use client'

import { useQuery } from '@tanstack/react-query'
import { offersService } from '../services/offers.service'

export function useOffers(page = 1) {
  return useQuery({
    queryKey: ['offers', page],
    queryFn: () => offersService.list(page),
    staleTime: 1000 * 60,
  })
}
