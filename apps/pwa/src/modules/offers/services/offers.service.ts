// TODO: descomentar chamadas reais ao apiClient quando o BFF resolver tenant em dev local
// import { apiClient } from '@/shared/services/api-client'
import type {
  BuyOfferInput,
  BuyOfferResponse,
  Offer,
  PaginatedResult,
  ShippingOption,
} from '@clube/shared-types'

const MOCK_OFFERS: Offer[] = [
  {
    id: 'offer-1',
    name: 'Vara de Pesca Carbono X',
    description:
      'Vara de carbono, 1,80m, ação média, ideal pra pesca esportiva.',
    priceFullCents: 45000,
    priceClubCents: 29900,
    stock: 24,
    images: ['/offers/offer-1.png'],
  },
  {
    id: 'offer-2',
    name: 'Carretilha Pro 5000',
    description:
      'Carretilha de alta performance, drag de 8kg, recuperação rápida.',
    priceFullCents: 68000,
    priceClubCents: 0,
    stock: 12,
    images: ['/offers/offer-2.png'],
  },
  {
    id: 'offer-3',
    name: 'Kit Iscas Artificiais',
    description: 'Kit com 20 iscas artificiais pra diversos tipos de pesca.',
    priceFullCents: 15000,
    priceClubCents: 8900,
    stock: 40,
    images: ['/offers/offer-3.png'],
  },
  {
    id: 'offer-4',
    name: 'Caixa Organizadora',
    description: 'Caixa de pesca com múltiplos compartimentos ajustáveis.',
    priceFullCents: 22000,
    priceClubCents: 14900,
    stock: 8,
    images: ['/offers/offer-4.png'],
  },
  {
    id: 'offer-5',
    name: 'Colete Salva-vidas',
    description: 'Colete salva-vidas homologado, tamanho único ajustável.',
    priceFullCents: 32000,
    priceClubCents: 0,
    stock: 15,
    images: ['/offers/offer-5.png'],
  },
  {
    id: 'offer-6',
    name: 'Boné Anzol Club',
    description: 'Boné oficial Anzol Club, bordado, ajuste traseiro.',
    priceFullCents: 9000,
    priceClubCents: 5900,
    stock: 60,
    images: ['/offers/offer-6.png'],
  },
  {
    id: 'offer-7',
    name: 'Linha Multifilamento 300m',
    description: 'Linha multifilamento de alta resistência, 300 metros.',
    priceFullCents: 18000,
    priceClubCents: 11900,
    stock: 35,
    images: ['/offers/offer-7.png'],
  },
  {
    id: 'offer-8',
    name: 'Canivete de Pesca',
    description: 'Canivete multiuso com alicate e abridor, aço inoxidável.',
    priceFullCents: 12000,
    priceClubCents: 0,
    stock: 5,
    images: ['/offers/offer-8.png'],
  },
]

const delay = <T>(value: T) => Promise.resolve(value)

export const offersService = {
  list: (_page = 1, _perPage = 20) =>
    // TODO: apiClient.get<PaginatedResult<Offer>>(`/v1/offers?page=${page}&perPage=${perPage}`)
    delay<PaginatedResult<Offer>>({
      items: MOCK_OFFERS,
      total: MOCK_OFFERS.length,
    }),

  getById: (id: string) =>
    // TODO: apiClient.get<Offer>(`/v1/offers/${id}`)
    delay<Offer>(
      MOCK_OFFERS.find((offer) => offer.id === id) ?? MOCK_OFFERS[0],
    ),

  buy: (_id: string, data: BuyOfferInput) =>
    // TODO: apiClient.post<BuyOfferResponse>(`/v1/offers/${id}/buy`, data)
    delay<BuyOfferResponse>({
      orderId: `mock-order-${Date.now()}`,
      totalCents: 0,
      paymentUrl: null,
      cashbackAppliedCents: data.cashbackUseCents,
    }),

  quoteShipping: (
    _items: Array<{ productId: string; qty: number }>,
    _destinationZipCode: string,
  ) =>
    // TODO: apiClient.get<ShippingOption[]>(`/v1/shipping/quote?...`)
    delay<ShippingOption[]>([
      { id: 1, name: 'PAC', price: 1990, deliveryTimeDays: 7 },
      { id: 2, name: 'SEDEX', price: 3490, deliveryTimeDays: 2 },
    ]),
}
