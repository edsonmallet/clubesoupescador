'use client'

import type { UpdateLevelInput } from '@clube/shared-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '../services/settings.service'

export function useLevels() {
  return useQuery({
    queryKey: ['admin-levels'],
    queryFn: () => settingsService.listLevels(),
  })
}

export function useUpdateLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLevelInput }) =>
      settingsService.updateLevel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-levels'] })
    },
  })
}
