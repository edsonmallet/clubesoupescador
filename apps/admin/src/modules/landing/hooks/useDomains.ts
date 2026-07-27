'use client'

import { useQuery } from '@tanstack/react-query'
import { landingService } from '../services/landing.service'

export function useDomains() {
  return useQuery({
    queryKey: ['admin-domains'],
    queryFn: () => landingService.listDomains(),
  })
}
