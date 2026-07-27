import type {
  CreateRaffleInput,
  PaginatedResult,
  Raffle,
  UpdateRaffleInput,
} from '@clube/shared-types'
import { apiClient } from '@/shared/services/api-client'

export const rafflesService = {
  list: (page = 1) =>
    apiClient.get<PaginatedResult<Raffle>>(`/v1/raffles?page=${page}`),
  getById: (id: string) => apiClient.get<Raffle>(`/v1/raffles/${id}`),
  create: (data: CreateRaffleInput) =>
    apiClient.post<Raffle>('/v1/admin/raffles', data),
  update: (id: string, data: UpdateRaffleInput) =>
    apiClient.patch<Raffle>(`/v1/admin/raffles/${id}`, data),
  draw: (id: string, contestNumber: number) =>
    apiClient.post<{ queued: boolean }>(`/v1/admin/raffles/${id}/draw`, {
      contestNumber,
    }),
}
