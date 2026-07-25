export type SubscriptionStatus = 'inactive' | 'active' | 'overdue' | 'cancelled'

export type SubscriptionProps = {
  id: string
  tenantId: string
  uid: string
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: SubscriptionStatus
  totalXp: number
  levelId: string | null
  createdAt: Date
  updatedAt: Date
}

export class Subscription {
  private constructor(private readonly props: SubscriptionProps) {}

  static create(props: SubscriptionProps): Subscription {
    return new Subscription(props)
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

  get planId(): string {
    return this.props.planId
  }

  get asaasCustomerId(): string | null {
    return this.props.asaasCustomerId
  }

  get asaasSubscriptionId(): string | null {
    return this.props.asaasSubscriptionId
  }

  get status(): SubscriptionStatus {
    return this.props.status
  }

  get totalXp(): number {
    return this.props.totalXp
  }

  get levelId(): string | null {
    return this.props.levelId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }
}
