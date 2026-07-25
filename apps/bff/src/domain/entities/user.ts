import type { Role } from '@clube/shared-types'

export type UserProps = {
  id: string
  tenantId: string
  uid: string
  role: Role
  createdAt: Date
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get uid(): string {
    return this.props.uid
  }

  get role(): Role {
    return this.props.role
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
