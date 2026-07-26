export type TopicProps = {
  id: string
  tenantId: string
  categoryId: string
  authorUid: string
  title: string
  body: string
  pinned: boolean
  locked: boolean
  deleted: boolean
  voteScore: number
  commentCount: number
  createdAt: Date
}

export class Topic {
  private constructor(private readonly props: TopicProps) {}

  static create(props: TopicProps): Topic {
    return new Topic(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get categoryId(): string {
    return this.props.categoryId
  }

  get authorUid(): string {
    return this.props.authorUid
  }

  get title(): string {
    return this.props.title
  }

  get body(): string {
    return this.props.body
  }

  get pinned(): boolean {
    return this.props.pinned
  }

  get locked(): boolean {
    return this.props.locked
  }

  get deleted(): boolean {
    return this.props.deleted
  }

  get voteScore(): number {
    return this.props.voteScore
  }

  get commentCount(): number {
    return this.props.commentCount
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
