import { apiClient } from '@/shared/services/api-client'
import type {
  CreateTournamentInput,
  PaginatedResult,
  Submission,
  Tournament,
} from '@clube/shared-types'

export const tournamentsService = {
  list: (page = 1) =>
    apiClient.get<PaginatedResult<Tournament>>(`/v1/tournaments?page=${page}`),
  getById: (id: string) => apiClient.get<Tournament>(`/v1/tournaments/${id}`),
  create: (data: CreateTournamentInput) =>
    apiClient.post<Tournament>('/v1/admin/tournaments', data),
  listSubmissions: (tournamentId: string) =>
    apiClient.get<Submission[]>(
      `/v1/admin/tournaments/${tournamentId}/submissions`,
    ),
  setScore: (submissionId: string, manualScore: number) =>
    apiClient.patch<Submission>(`/v1/admin/submissions/${submissionId}/score`, {
      manualScore,
    }),
}
