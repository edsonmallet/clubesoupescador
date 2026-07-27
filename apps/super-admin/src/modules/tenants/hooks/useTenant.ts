'use client'

import { useQuery } from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: () => tenantsService.getById(id),
  })
}
