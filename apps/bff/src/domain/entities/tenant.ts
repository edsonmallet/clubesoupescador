export type TenantStatus = 'active' | 'suspended' | 'canceled'

export type TenantProps = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  planId: string | null
  status: TenantStatus
  ownerUid: string
  settings: Record<string, unknown>
  createdAt: Date
}

export class Tenant {
  private constructor(private readonly props: TenantProps) {}

  static create(props: TenantProps): Tenant {
    return new Tenant(props)
  }

  get id(): string {
    return this.props.id
  }

  get slug(): string {
    return this.props.slug
  }

  get name(): string {
    return this.props.name
  }

  get logoUrl(): string | null {
    return this.props.logoUrl
  }

  get planId(): string | null {
    return this.props.planId
  }

  get status(): TenantStatus {
    return this.props.status
  }

  get ownerUid(): string {
    return this.props.ownerUid
  }

  get settings(): Record<string, unknown> {
    return this.props.settings
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
