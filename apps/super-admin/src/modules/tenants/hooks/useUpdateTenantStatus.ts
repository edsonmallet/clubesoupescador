'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'

export function useUpdateTenantStatus(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: 'active' | 'suspended') =>
      tenantsService.updateStatus(tenantId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}
