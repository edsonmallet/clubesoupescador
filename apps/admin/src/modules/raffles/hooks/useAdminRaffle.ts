'use client'

import { useQuery } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useAdminRaffle(id: string) {
  return useQuery({
    queryKey: ['admin-raffle', id],
    queryFn: () => rafflesService.getById(id),
  })
}
