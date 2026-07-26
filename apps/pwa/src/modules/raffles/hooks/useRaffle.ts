'use client'

import { useQuery } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useRaffle(id: string) {
  return useQuery({
    queryKey: ['raffle', id],
    queryFn: () => rafflesService.getById(id),
  })
}
