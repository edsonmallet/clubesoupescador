export type CashbackEntryType =
  | 'earned_purchase'
  | 'redeemed'
  | 'expired_to_xp'
  | 'manual_adjustment'

export type CashbackEntryProps = {
  id: string
  tenantId: string
  uid: string
  type: CashbackEntryType
  amountCents: number
  source: string
  sourceId: string | null
  expiresAt: Date | null
  createdAt: Date
}

export class CashbackEntry {
  private constructor(private readonly props: CashbackEntryProps) {}

  static create(props: CashbackEntryProps): CashbackEntry {
    return new CashbackEntry(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get uid(): string {
    return this.props.uid
  }

  get type(): CashbackEntryType {
    return this.props.type
  }

  get amountCents(): number {
    return this.props.amountCents
  }

  get source(): string {
    return this.props.source
  }

  get sourceId(): string | null {
    return this.props.sourceId
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  isCredit(): boolean {
    return this.props.amountCents > 0
  }
}
