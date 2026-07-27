'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { landingService } from '../services/landing.service'

export function useAddDomain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (domain: string) => landingService.addDomain(domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-domains'] })
    },
  })
}
