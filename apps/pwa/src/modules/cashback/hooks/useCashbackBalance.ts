'use client'

import { useQuery } from '@tanstack/react-query'
import { cashbackService } from '../services/cashback.service'

export function useCashbackBalance() {
  return useQuery({
    queryKey: ['cashback-balance'],
    queryFn: () => cashbackService.getBalance(),
  })
}
