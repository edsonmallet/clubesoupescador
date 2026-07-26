'use client'

import { useQuery } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useRaffles(page = 1) {
  return useQuery({
    queryKey: ['raffles', page],
    queryFn: () => rafflesService.list(page),
  })
}
