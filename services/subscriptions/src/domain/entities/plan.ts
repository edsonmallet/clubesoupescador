export type PlanProps = {
  id: string
  tenantId: string
  name: string
  priceCents: number
  active: boolean
  createdAt: Date
}

export class Plan {
  private constructor(private readonly props: PlanProps) {}

  static create(props: PlanProps): Plan {
    return new Plan(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get name(): string {
    return this.props.name
  }

  get priceCents(): number {
    return this.props.priceCents
  }

  get active(): boolean {
    return this.props.active
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
