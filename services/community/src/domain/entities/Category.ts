export type CategoryProps = {
  id: string
  tenantId: string
  slug: string
  name: string
  description: string
  createdAt: Date
}

export class Category {
  private constructor(private readonly props: CategoryProps) {}

  static create(props: CategoryProps): Category {
    return new Category(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get slug(): string {
    return this.props.slug
  }

  get name(): string {
    return this.props.name
  }

  get description(): string {
    return this.props.description
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
