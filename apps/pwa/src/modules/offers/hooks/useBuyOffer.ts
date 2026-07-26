'use client'

import type { BuyOfferInput } from '@clube/shared-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { offersService } from '../services/offers.service'

export function useBuyOffer(offerId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: BuyOfferInput) => offersService.buy(offerId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (response.paymentUrl) {
        window.open(response.paymentUrl, '_blank')
      }
      router.push('/pedidos')
    },
  })
}
