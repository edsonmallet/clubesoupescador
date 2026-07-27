'use client'

import { useMutation } from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'

export function useImpersonateTenant(tenantId: string) {
  return useMutation({
    mutationFn: async () => {
      const popup = window.open('', '_blank')
      const result = await tenantsService.impersonate(tenantId)
      if (popup) {
        popup.location.href = `https://admin.${result.slug}.clube.com.br/impersonate?token=${result.token}`
      }
      return result
    },
  })
}
