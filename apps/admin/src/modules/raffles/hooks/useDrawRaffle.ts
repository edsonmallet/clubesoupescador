'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useDrawRaffle(raffleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contestNumber: number) => rafflesService.draw(raffleId, contestNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-raffles'] })
      queryClient.invalidateQueries({ queryKey: ['admin-raffle', raffleId] })
    },
  })
}
