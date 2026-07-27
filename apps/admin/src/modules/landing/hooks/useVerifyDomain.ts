'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { landingService } from '../services/landing.service'

export function useVerifyDomain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => landingService.verifyDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-domains'] })
    },
  })
}
