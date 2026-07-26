'use client'

import { useQuery } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useMyTickets(id: string) {
  return useQuery({
    queryKey: ['my-tickets', id],
    queryFn: () => rafflesService.myTickets(id),
  })
}
