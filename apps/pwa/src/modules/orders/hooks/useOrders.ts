'use client'

import { useQuery } from '@tanstack/react-query'
import { ordersService } from '../services/orders.service'

export function useOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersService.list(page),
  })
}
