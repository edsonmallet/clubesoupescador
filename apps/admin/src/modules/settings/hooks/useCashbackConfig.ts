'use client'

import type { CashbackConfigItem } from '@clube/shared-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '../services/settings.service'

export function useCashbackConfig() {
  return useQuery({
    queryKey: ['cashback-config'],
    queryFn: () => settingsService.listCashbackConfig(),
  })
}

export function useUpdateCashbackConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CashbackConfigItem) => settingsService.updateCashbackConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashback-config'] })
    },
  })
}
