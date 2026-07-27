export type RaffleStatus = 'open' | 'closed' | 'drawn'

export type RaffleProps = {
  id: string
  tenantId: string
  title: string
  description: string
  prize: string
  imageUrl: string | null
  ticketPriceCents: number
  maxTickets: number | null
  drawDate: Date | null
  lotteryGame: string
  status: RaffleStatus
  contestNumber: number | null
  winnerTicket: number | null
  winnerUid: string | null
  drawnAt: Date | null
  createdAt: Date
}

export class Raffle {
  private constructor(private readonly props: RaffleProps) {}

  static create(props: RaffleProps): Raffle {
    return new Raffle(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get title(): string {
    return this.props.title
  }

  get description(): string {
    return this.props.description
  }

  get prize(): string {
    return this.props.prize
  }

  get imageUrl(): string | null {
    return this.props.imageUrl
  }

  get ticketPriceCents(): number {
    return this.props.ticketPriceCents
  }

  get maxTickets(): number | null {
    return this.props.maxTickets
  }

  get drawDate(): Date | null {
    return this.props.drawDate
  }

  get lotteryGame(): string {
    return this.props.lotteryGame
  }

  get status(): RaffleStatus {
    return this.props.status
  }

  get contestNumber(): number | null {
    return this.props.contestNumber
  }

  get winnerTicket(): number | null {
    return this.props.winnerTicket
  }

  get winnerUid(): string | null {
    return this.props.winnerUid
  }

  get drawnAt(): Date | null {
    return this.props.drawnAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  isOpen(): boolean {
    return this.props.status === 'open'
  }
}
