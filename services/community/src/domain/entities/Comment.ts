export type CommentProps = {
  id: string
  tenantId: string
  topicId: string
  authorUid: string
  parentId: string | null
  depth: number
  body: string
  voteScore: number
  deleted: boolean
  createdAt: Date
}

export class Comment {
  private constructor(private readonly props: CommentProps) {}

  static create(props: CommentProps): Comment {
    return new Comment(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get topicId(): string {
    return this.props.topicId
  }

  get authorUid(): string {
    return this.props.authorUid
  }

  get parentId(): string | null {
    return this.props.parentId
  }

  get depth(): number {
    return this.props.depth
  }

  get body(): string {
    return this.props.body
  }

  get voteScore(): number {
    return this.props.voteScore
  }

  get deleted(): boolean {
    return this.props.deleted
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
