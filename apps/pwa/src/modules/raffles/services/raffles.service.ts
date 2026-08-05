// TODO: descomentar chamadas reais ao apiClient quando o BFF resolver tenant em dev local
// e o serviço services/raffles (porta 3008) estiver rodando
// import { apiClient } from '@/shared/services/api-client'
import type {
  BuyTicketsResponse,
  JoinRaffleResponse,
  PaginatedResult,
  Raffle,
  RaffleResult,
  Ticket,
} from '@clube/shared-types'

const MOCK_RAFFLES: Raffle[] = [
  {
    id: 'mock-1',
    title: 'Rifa Vara de Pesca Premium',
    description:
      'Concorra a uma vara de pesca profissional para pesca esportiva.',
    prize: 'Vara de pesca profissional',
    imageUrl: '/raffles/raffle-1.png',
    ticketPriceCents: 1000,
    maxTickets: 500,
    drawDate: '2026-09-01T20:00:00.000Z',
    lotteryGame: 'federal',
    status: 'open',
    contestNumber: null,
    winnerTicket: null,
    winnerUid: null,
    drawnAt: null,
    createdAt: '2026-08-01T12:00:00.000Z',
  },
  {
    id: 'mock-2',
    title: 'Rifa Kit Iscas Artificiais',
    description:
      'Kit completo de iscas artificiais para diversos tipos de pesca.',
    prize: 'Kit de iscas artificiais',
    imageUrl: '/raffles/raffle-2.png',
    ticketPriceCents: 500,
    maxTickets: 300,
    drawDate: '2026-08-20T20:00:00.000Z',
    lotteryGame: 'federal',
    status: 'open',
    contestNumber: null,
    winnerTicket: null,
    winnerUid: null,
    drawnAt: null,
    createdAt: '2026-07-20T12:00:00.000Z',
  },
  {
    id: 'mock-3',
    title: 'Rifa Caixa de Pesca Organizadora',
    description: 'Caixa organizadora de pesca com múltiplos compartimentos.',
    prize: 'Caixa de pesca organizadora',
    imageUrl: '/raffles/raffle-3.png',
    ticketPriceCents: 500,
    maxTickets: 200,
    drawDate: '2026-07-15T20:00:00.000Z',
    lotteryGame: 'federal',
    status: 'closed',
    contestNumber: null,
    winnerTicket: null,
    winnerUid: null,
    drawnAt: null,
    createdAt: '2026-06-15T12:00:00.000Z',
  },
  {
    id: 'mock-4',
    title: 'Rifa Barco Inflável 2 Lugares',
    description: 'Barco inflável para pesca, 2 lugares, com remos inclusos.',
    prize: 'Barco inflável 2 lugares',
    imageUrl: '/raffles/raffle-4.png',
    ticketPriceCents: 2000,
    maxTickets: 1000,
    drawDate: '2026-06-10T20:00:00.000Z',
    lotteryGame: 'federal',
    status: 'drawn',
    contestNumber: 5842,
    winnerTicket: 731,
    winnerUid: 'mock-winner-uid',
    drawnAt: '2026-06-10T20:30:00.000Z',
    createdAt: '2026-05-10T12:00:00.000Z',
  },
]

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'mock-ticket-1',
    number: 42,
    status: 'confirmed',
    source: 'subscription_conversion',
    createdAt: '2026-08-01T12:00:00.000Z',
  },
  {
    id: 'mock-ticket-2',
    number: 187,
    status: 'confirmed',
    source: 'purchase',
    createdAt: '2026-08-02T12:00:00.000Z',
  },
]

const delay = <T>(value: T) => Promise.resolve(value)

// Mock-only: shared-types não tem conceito de "números vendidos/disponíveis"
// hoje (buyTickets só aceita quantidade). Gerado localmente pra alimentar a
// grade de seleção de números na tela de detalhe.
export type RaffleNumbers = { total: number; taken: number[] }

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  return () => {
    h = (h * 1103515245 + 12345) | 0
    return ((h >>> 0) % 1000) / 1000
  }
}

function buildTakenNumbers(id: string, total: number, ratio: number) {
  const random = seededRandom(id)
  const takenCount = Math.round(total * ratio)

  // Fisher-Yates: sempre O(total), nunca depende do gerador cobrir todo o
  // espaço de valores (sortear com reposição até juntar N únicos pode nunca
  // terminar se o gerador tiver ciclo curto).
  const pool = Array.from({ length: total }, (_, i) => i + 1)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, takenCount).sort((a, b) => a - b)
}

export const rafflesService = {
  list: (_page = 1) =>
    // TODO: apiClient.get<PaginatedResult<Raffle>>(`/v1/raffles?page=${page}`)
    delay<PaginatedResult<Raffle>>({
      items: MOCK_RAFFLES,
      total: MOCK_RAFFLES.length,
    }),

  getById: (id: string) =>
    // TODO: apiClient.get<Raffle>(`/v1/raffles/${id}`)
    delay<Raffle>(
      MOCK_RAFFLES.find((raffle) => raffle.id === id) ?? MOCK_RAFFLES[0],
    ),

  getResult: (id: string) => {
    // TODO: apiClient.get<RaffleResult>(`/v1/raffles/${id}/result`)
    const raffle = MOCK_RAFFLES.find((r) => r.id === id) ?? MOCK_RAFFLES[0]
    return delay<RaffleResult>({
      status: raffle.status,
      contestNumber: raffle.contestNumber,
      winnerTicket: raffle.winnerTicket,
      winnerUid: raffle.winnerUid,
      drawnAt: raffle.drawnAt,
    })
  },

  join: (_id: string) =>
    // TODO: apiClient.post<JoinRaffleResponse>(`/v1/raffles/${id}/join`)
    delay<JoinRaffleResponse>({
      tickets: [MOCK_TICKETS[0]],
      count: 1,
    }),

  buy: (_id: string, qty: number) =>
    // TODO: apiClient.post<BuyTicketsResponse>(`/v1/raffles/${id}/buy`, { qty })
    delay<BuyTicketsResponse>({
      tickets: Array.from({ length: qty }, (_, index) => ({
        id: `mock-purchased-${index}`,
        number: 900 + index,
        status: 'confirmed' as const,
        source: 'purchase' as const,
        createdAt: new Date().toISOString(),
      })),
      paymentUrl: null,
    }),

  myTickets: (_id: string) =>
    // TODO: apiClient.get<Ticket[]>(`/v1/raffles/${id}/my-tickets`)
    delay<Ticket[]>(MOCK_TICKETS),

  // Mock-only — ver comentário de RaffleNumbers acima. TODO: substituir por
  // endpoint real quando o backend suportar números individuais por rifa.
  getNumbers: (id: string) => {
    const raffle = MOCK_RAFFLES.find((r) => r.id === id) ?? MOCK_RAFFLES[0]
    const total = raffle.maxTickets ?? 100
    const ratio =
      raffle.status === 'open' ? 0.72 : raffle.status === 'closed' ? 0.95 : 1
    return delay<RaffleNumbers>({
      total,
      taken: buildTakenNumbers(raffle.id, total, ratio),
    })
  },
}
