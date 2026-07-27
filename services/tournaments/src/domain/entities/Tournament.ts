export type TournamentStatus = 'open' | 'closed'

export type TournamentProps = {
  id: string
  tenantId: string
  title: string
  description: string
  status: TournamentStatus
  createdAt: Date
}

export class Tournament {
  private constructor(private readonly props: TournamentProps) {}

  static create(props: TournamentProps): Tournament {
    return new Tournament(props)
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

  get status(): TournamentStatus {
    return this.props.status
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
