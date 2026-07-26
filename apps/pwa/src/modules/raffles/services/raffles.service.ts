import { apiClient } from '@/shared/services/api-client'
import type {
  BuyTicketsResponse,
  JoinRaffleResponse,
  PaginatedResult,
  Raffle,
  RaffleResult,
  Ticket,
} from '@clube/shared-types'

export const rafflesService = {
  list: (page = 1) =>
    apiClient.get<PaginatedResult<Raffle>>(`/v1/raffles?page=${page}`),
  getById: (id: string) => apiClient.get<Raffle>(`/v1/raffles/${id}`),
  getResult: (id: string) =>
    apiClient.get<RaffleResult>(`/v1/raffles/${id}/result`),
  join: (id: string) =>
    apiClient.post<JoinRaffleResponse>(`/v1/raffles/${id}/join`),
  buy: (id: string, qty: number) =>
    apiClient.post<BuyTicketsResponse>(`/v1/raffles/${id}/buy`, { qty }),
  myTickets: (id: string) =>
    apiClient.get<Ticket[]>(`/v1/raffles/${id}/my-tickets`),
}
