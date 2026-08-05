'use client'

import { useQuery } from '@tanstack/react-query'
import { storesService } from '../services/stores.service'

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => storesService.list(),
  })
}
