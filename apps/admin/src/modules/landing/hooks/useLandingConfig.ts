'use client'

import { useQuery } from '@tanstack/react-query'
import { landingService } from '../services/landing.service'

export function useLandingConfig() {
  return useQuery({
    queryKey: ['landing-config'],
    queryFn: () => landingService.getConfig(),
  })
}
