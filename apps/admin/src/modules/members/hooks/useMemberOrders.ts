'use client'

import { useQuery } from '@tanstack/react-query'
import { membersService } from '../services/members.service'

export function useMemberOrders(uid: string) {
  return useQuery({
    queryKey: ['member-orders', uid],
    queryFn: () => membersService.getOrders(uid),
  })
}
