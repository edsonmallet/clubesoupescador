import type { Role } from '@clube/shared-types'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'

export type GetMeInput = {
  uid: string
  tenantId: string
  role: Role
}

export type GetMeResult = {
  uid: string
  role: Role
  tenantId: string
  registeredAt: Date | null
}

export class GetMeUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetMeInput): Promise<GetMeResult> {
    const user = await this.userRepository.findByUid(
      input.uid,
      input.tenantId,
    )

    return {
      uid: input.uid,
      role: input.role,
      tenantId: input.tenantId,
      registeredAt: user?.createdAt ?? null,
    }
  }
}
