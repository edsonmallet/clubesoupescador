import { setRole } from '@clube/firebase-utils'
import type { Tenant } from '../../domain/entities/tenant'
import { SlugAlreadyTakenError } from '../../domain/errors/slug-already-taken.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import type { IUserRepository } from '../../domain/interfaces/IUserRepository'

export type CreateTenantInput = {
  slug: string
  name: string
  ownerUid: string
  logoUrl?: string | null
}

export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: CreateTenantInput): Promise<Tenant> {
    const existing = await this.tenantRepository.findBySlug(input.slug)
    if (existing) {
      throw new SlugAlreadyTakenError(input.slug)
    }

    const tenant = await this.tenantRepository.create({
      slug: input.slug,
      name: input.name,
      ownerUid: input.ownerUid,
      logoUrl: input.logoUrl ?? null,
    })

    await this.userRepository.create({
      tenantId: tenant.id,
      uid: input.ownerUid,
      role: 'store_owner',
    })

    await setRole(input.ownerUid, 'store_owner', tenant.id)

    return tenant
  }
}
