import { apiClient } from '@/shared/services/api-client'
import type {
  BuyOfferInput,
  BuyOfferResponse,
  Offer,
  PaginatedResult,
  ShippingOption,
} from '@clube/shared-types'

export const offersService = {
  list: (page = 1, perPage = 20) =>
    apiClient.get<PaginatedResult<Offer>>(
      `/v1/offers?page=${page}&perPage=${perPage}`,
    ),
  getById: (id: string) => apiClient.get<Offer>(`/v1/offers/${id}`),
  buy: (id: string, data: BuyOfferInput) =>
    apiClient.post<BuyOfferResponse>(`/v1/offers/${id}/buy`, data),
  quoteShipping: (
    items: Array<{ productId: string; qty: number }>,
    destinationZipCode: string,
  ) =>
    apiClient.get<ShippingOption[]>(
      `/v1/shipping/quote?items=${encodeURIComponent(JSON.stringify(items))}&destinationZipCode=${encodeURIComponent(destinationZipCode)}`,
    ),
}
