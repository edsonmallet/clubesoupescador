export type SubmissionProps = {
  id: string
  tenantId: string
  tournamentId: string
  authorUid: string
  mediaUrl: string
  voteScore: number
  manualScore: number | null
  createdAt: Date
}

export class Submission {
  private constructor(private readonly props: SubmissionProps) {}

  static create(props: SubmissionProps): Submission {
    return new Submission(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get tournamentId(): string {
    return this.props.tournamentId
  }

  get authorUid(): string {
    return this.props.authorUid
  }

  get mediaUrl(): string {
    return this.props.mediaUrl
  }

  get voteScore(): number {
    return this.props.voteScore
  }

  get manualScore(): number | null {
    return this.props.manualScore
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
