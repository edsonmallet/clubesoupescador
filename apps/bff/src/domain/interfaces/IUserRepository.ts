import type { Role } from '@clube/shared-types'
import type { User } from '../entities/user'

export type CreateUserDto = {
  tenantId: string
  uid: string
  role: Role
}

export interface IUserRepository {
  findByUid(uid: string, tenantId: string): Promise<User | null>
  create(data: CreateUserDto): Promise<User>
}
