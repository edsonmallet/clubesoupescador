'use client'

import type { XpConfigItem } from '@clube/shared-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '../services/settings.service'

export function useXpConfig() {
  return useQuery({
    queryKey: ['xp-config'],
    queryFn: () => settingsService.listXpConfig(),
  })
}

export function useUpdateXpConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: XpConfigItem) => settingsService.updateXpConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp-config'] })
    },
  })
}
