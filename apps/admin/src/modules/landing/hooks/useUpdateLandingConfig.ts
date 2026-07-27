'use client'

import type { UpdateLandingConfigInput } from '@clube/shared-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { landingService } from '../services/landing.service'

export function useUpdateLandingConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateLandingConfigInput) =>
      landingService.updateConfig(data),
    onSuccess: (config) => {
      queryClient.setQueryData(['landing-config'], config)
    },
  })
}
