import type { Raffle, RaffleStatus } from '../entities/Raffle'

export type CreateRaffleDto = {
  tenantId: string
  title: string
  description: string
  prize: string
  imageUrl: string | null
  ticketPriceCents: number
  maxTickets: number | null
  drawDate: Date | null
  lotteryGame: string
}

export type UpdateRaffleDto = Partial<{
  title: string
  description: string
  prize: string
  imageUrl: string | null
  ticketPriceCents: number
  maxTickets: number | null
  drawDate: Date | null
  lotteryGame: string
  status: RaffleStatus
  contestNumber: number
}>

export type PaginatedResult<T> = {
  items: T[]
  total: number
}

export interface IRaffleRepository {
  findMany(
    tenantId: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Raffle>>
  findById(tenantId: string, id: string): Promise<Raffle | null>
  create(data: CreateRaffleDto): Promise<Raffle>
  update(id: string, data: UpdateRaffleDto): Promise<Raffle>
  setWinner(
    id: string,
    winnerTicket: number,
    winnerUid: string,
    drawnAt: Date,
  ): Promise<Raffle>
}
