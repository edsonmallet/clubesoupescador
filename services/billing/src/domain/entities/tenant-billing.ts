export type TenantBillingStatus =
  | 'inactive'
  | 'active'
  | 'overdue'
  | 'cancelled'

export type TenantBillingProps = {
  id: string
  tenantId: string
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: TenantBillingStatus
  createdAt: Date
  updatedAt: Date
}

export class TenantBilling {
  private constructor(private readonly props: TenantBillingProps) {}

  static create(props: TenantBillingProps): TenantBilling {
    return new TenantBilling(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
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

  get status(): TenantBillingStatus {
    return this.props.status
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }
}
