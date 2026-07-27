'use client'

import { useMutation } from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'

export function useImpersonateTenant(tenantId: string) {
  return useMutation({
    mutationFn: () => tenantsService.impersonate(tenantId),
    onSuccess: ({ token, slug }) => {
      window.open(`https://admin.${slug}.clube.com.br/impersonate?token=${token}`, '_blank')
    },
  })
}
