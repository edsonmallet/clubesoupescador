'use client'

import { useQuery } from '@tanstack/react-query'
import { cashbackService } from '../services/cashback.service'

export function useCashbackHistory(page = 1) {
  return useQuery({
    queryKey: ['cashback-history', page],
    queryFn: () => cashbackService.getHistory(page),
  })
}
