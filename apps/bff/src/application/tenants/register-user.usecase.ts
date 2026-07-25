import { setRole } from '@clube/firebase-utils'
import type { Role } from '@clube/shared-types'
import type { User } from '../../domain/entities/user'
import { UserAlreadyRegisteredError } from '../../domain/errors/user-already-registered.error'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'

export type RegisterUserInput = {
  uid: string
  tenantId: string
  currentRole: Role
  currentTenantId: string | null
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<User> {
    if (input.currentTenantId && input.currentTenantId !== input.tenantId) {
      throw new UserAlreadyRegisteredError(input.uid)
    }

    if (input.currentRole !== 'user') {
      throw new UserAlreadyRegisteredError(input.uid)
    }

    const existing = await this.userRepository.findByUid(
      input.uid,
      input.tenantId,
    )
    if (existing) {
      throw new UserAlreadyRegisteredError(input.uid)
    }

    await setRole(input.uid, 'user', input.tenantId)

    try {
      return await this.userRepository.create({
        tenantId: input.tenantId,
        uid: input.uid,
        role: 'user',
      })
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new UserAlreadyRegisteredError(input.uid)
      }
      throw error
    }
  }
}
