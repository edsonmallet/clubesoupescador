'use client'

import { useQuery } from '@tanstack/react-query'
import { tournamentsService } from '../services/tournaments.service'

export function useAdminTournaments(page = 1) {
  return useQuery({
    queryKey: ['admin-tournaments', page],
    queryFn: () => tournamentsService.list(page),
  })
}
