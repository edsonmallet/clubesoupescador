'use client'

import { useQuery } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useAdminRaffles(page = 1) {
  return useQuery({
    queryKey: ['admin-raffles', page],
    queryFn: () => rafflesService.list(page),
  })
}
