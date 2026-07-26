'use client'

import { useMutation } from '@tanstack/react-query'
import { offersService } from '../services/offers.service'

export function useShippingQuote(productId: string) {
  return useMutation({
    mutationFn: ({ qty, zipCode }: { qty: number; zipCode: string }) =>
      offersService.quoteShipping([{ productId, qty }], zipCode),
  })
}
