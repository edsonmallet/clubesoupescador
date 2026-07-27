'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { membersService } from '../services/members.service'

export function usePromoteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uid: string) => membersService.promote(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
  })
}
