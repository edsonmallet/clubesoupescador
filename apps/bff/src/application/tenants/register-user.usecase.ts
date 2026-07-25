import { setRole } from '@clube/firebase-utils'
import type { User } from '../../domain/entities/user'
import { UserAlreadyRegisteredError } from '../../domain/errors/user-already-registered.error'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'

export type RegisterUserInput = {
  uid: string
  tenantId: string
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const existing = await this.userRepository.findByUid(
      input.uid,
      input.tenantId,
    )
    if (existing) {
      throw new UserAlreadyRegisteredError(input.uid)
    }

    const user = await this.userRepository.create({
      tenantId: input.tenantId,
      uid: input.uid,
      role: 'user',
    })

    await setRole(input.uid, 'user', input.tenantId)

    return user
  }
}
