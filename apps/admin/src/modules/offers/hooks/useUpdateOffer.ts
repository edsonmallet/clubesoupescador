'use client'

import type { UpdateOfferInput } from '@clube/shared-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { offersService } from '../services/offers.service'

export function useUpdateOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOfferInput }) =>
      offersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] })
    },
  })
}
