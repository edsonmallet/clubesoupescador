export type SaasPlanProps = {
  id: string
  name: string
  priceCents: number
  active: boolean
  createdAt: Date
}

export class SaasPlan {
  private constructor(private readonly props: SaasPlanProps) {}

  static create(props: SaasPlanProps): SaasPlan {
    return new SaasPlan(props)
  }

  get id(): string {
    return this.props.id
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
