'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rafflesService } from '../services/raffles.service'

export function useBuyTickets(raffleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (qty: number) => rafflesService.buy(raffleId, qty),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets', raffleId] })
      if (response.paymentUrl) {
        window.open(response.paymentUrl, '_blank')
      }
    },
  })
}
