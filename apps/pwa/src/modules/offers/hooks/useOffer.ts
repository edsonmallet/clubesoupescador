'use client'

import { useQuery } from '@tanstack/react-query'
import { offersService } from '../services/offers.service'

export function useOffer(id: string) {
  return useQuery({
    queryKey: ['offer', id],
    queryFn: () => offersService.getById(id),
  })
}
