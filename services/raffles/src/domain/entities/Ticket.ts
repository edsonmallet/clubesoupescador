export type TicketStatus = 'pending' | 'confirmed'
export type TicketSource = 'subscription_conversion' | 'purchase'

export type TicketProps = {
  id: string
  tenantId: string
  raffleId: string
  uid: string
  number: number
  status: TicketStatus
  source: TicketSource
  asaasPaymentId: string | null
  createdAt: Date
}

export class Ticket {
  private constructor(private readonly props: TicketProps) {}

  static create(props: TicketProps): Ticket {
    return new Ticket(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get raffleId(): string {
    return this.props.raffleId
  }

  get uid(): string {
    return this.props.uid
  }

  get number(): number {
    return this.props.number
  }

  get status(): TicketStatus {
    return this.props.status
  }

  get source(): TicketSource {
    return this.props.source
  }

  get asaasPaymentId(): string | null {
    return this.props.asaasPaymentId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
