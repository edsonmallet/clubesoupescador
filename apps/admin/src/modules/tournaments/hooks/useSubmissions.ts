'use client'

import { useQuery } from '@tanstack/react-query'
import { tournamentsService } from '../services/tournaments.service'

export function useSubmissions(tournamentId: string) {
  return useQuery({
    queryKey: ['admin-submissions', tournamentId],
    queryFn: () => tournamentsService.listSubmissions(tournamentId),
  })
}
