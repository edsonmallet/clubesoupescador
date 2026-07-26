'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '../services/orders.service'

export function useDispatchOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, trackingCode }: { id: string; trackingCode: string }) =>
      ordersService.dispatch(id, trackingCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })
}
