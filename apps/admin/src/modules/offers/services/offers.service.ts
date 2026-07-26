import { apiClient } from '@/shared/services/api-client'
import type {
  AdminOffer,
  CreateOfferInput,
  PaginatedResult,
  UpdateOfferInput,
} from '@clube/shared-types'

export const offersService = {
  list: (page = 1) =>
    apiClient.get<PaginatedResult<AdminOffer>>(`/v1/admin/offers?page=${page}`),
  create: (data: CreateOfferInput) =>
    apiClient.post<AdminOffer>('/v1/admin/offers', data),
  update: (id: string, data: UpdateOfferInput) =>
    apiClient.patch<AdminOffer>(`/v1/admin/offers/${id}`, data),
}
