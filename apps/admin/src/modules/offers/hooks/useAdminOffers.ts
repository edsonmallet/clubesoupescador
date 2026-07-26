'use client'

import { useQuery } from '@tanstack/react-query'
import { offersService } from '../services/offers.service'

export function useAdminOffers(page = 1) {
  return useQuery({
    queryKey: ['admin-offers', page],
    queryFn: () => offersService.list(page),
  })
}
