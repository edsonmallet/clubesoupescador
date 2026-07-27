'use client'

import { useQuery } from '@tanstack/react-query'
import { membersService } from '../services/members.service'

export function useAdminMembers(page = 1) {
  return useQuery({
    queryKey: ['admin-members', page],
    queryFn: () => membersService.list(page),
  })
}
