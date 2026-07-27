'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tournamentsService } from '../services/tournaments.service'

export function useSetScore(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      submissionId,
      manualScore,
    }: { submissionId: string; manualScore: number }) =>
      tournamentsService.setScore(submissionId, manualScore),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-submissions', tournamentId],
      })
    },
  })
}
