'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communityService } from '../services/community.service'

export function useReaction(
  targetType: 'topic' | 'comment',
  targetId: string,
  topicId?: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (emoji: string) =>
      targetType === 'topic'
        ? communityService.reactTopic(targetId, emoji)
        : communityService.reactComment(targetId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['community-topic', topicId ?? targetId],
      })
    },
  })
}
