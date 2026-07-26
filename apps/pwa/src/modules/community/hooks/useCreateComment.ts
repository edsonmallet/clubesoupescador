'use client'

import type { CreateCommentInput } from '@clube/shared-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communityService } from '../services/community.service'

export function useCreateComment(topicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCommentInput) =>
      communityService.createComment(topicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-topic', topicId] })
    },
  })
}
