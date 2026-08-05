'use client'

import { useQuery } from '@tanstack/react-query'
import { storesService } from '../services/stores.service'

export function useStore(id: string) {
  return useQuery({
    queryKey: ['store', id],
    queryFn: () => storesService.getById(id),
  })
}
