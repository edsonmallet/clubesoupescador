'use client'

import { useQuery } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useRaffleResult(id: string) {
  return useQuery({
    queryKey: ['raffle-result', id],
    queryFn: () => rafflesService.getResult(id),
  })
}
