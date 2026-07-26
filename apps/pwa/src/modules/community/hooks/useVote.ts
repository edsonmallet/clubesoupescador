'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communityService } from '../services/community.service'

export function useVote(
  targetType: 'topic' | 'comment',
  targetId: string,
  topicId?: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (value: 1 | -1) =>
      targetType === 'topic'
        ? communityService.voteTopic(targetId, value)
        : communityService.voteComment(targetId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-topics'] })
      queryClient.invalidateQueries({
        queryKey: ['community-topic', topicId ?? targetId],
      })
    },
  })
}
