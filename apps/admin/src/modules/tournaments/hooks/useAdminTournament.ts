'use client'

import { useQuery } from '@tanstack/react-query'
import { tournamentsService } from '../services/tournaments.service'

export function useAdminTournament(id: string) {
  return useQuery({
    queryKey: ['admin-tournament', id],
    queryFn: () => tournamentsService.getById(id),
  })
}
