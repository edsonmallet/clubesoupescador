export type DomainType = 'subdomain' | 'custom'

export type DomainProps = {
  id: string
  tenantId: string
  domain: string
  type: DomainType
  verified: boolean
  verifiedAt: Date | null
  lastError: string | null
  createdAt: Date
}

export class Domain {
  private constructor(private readonly props: DomainProps) {}

  static create(props: DomainProps): Domain {
    return new Domain(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get domain(): string {
    return this.props.domain
  }

  get type(): DomainType {
    return this.props.type
  }

  get verified(): boolean {
    return this.props.verified
  }

  get verifiedAt(): Date | null {
    return this.props.verifiedAt
  }

  get lastError(): string | null {
    return this.props.lastError
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
