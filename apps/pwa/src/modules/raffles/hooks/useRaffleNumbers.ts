'use client'

import { useQuery } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useRaffleNumbers(id: string) {
  return useQuery({
    queryKey: ['raffle-numbers', id],
    queryFn: () => rafflesService.getNumbers(id),
  })
}
