'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useJoinRaffle(raffleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => rafflesService.join(raffleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets', raffleId] })
      queryClient.invalidateQueries({ queryKey: ['raffle', raffleId] })
    },
  })
}
