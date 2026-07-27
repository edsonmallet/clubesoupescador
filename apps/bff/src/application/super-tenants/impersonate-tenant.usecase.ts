import { getFirebaseApp } from '@clube/firebase-utils'
import { getAuth } from 'firebase-admin/auth'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'

export type ImpersonateResult = {
  token: string
  ownerUid: string
  slug: string
}

export class ImpersonateTenantUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(tenantId: string, superAdminUid: string): Promise<ImpersonateResult> {
    const tenant = await this.tenantRepository.findById(tenantId)
    if (!tenant) {
      throw new TenantNotFoundError(tenantId)
    }

    const token = await getAuth(getFirebaseApp()).createCustomToken(tenant.ownerUid, {
      impersonated_by: superAdminUid,
    })

    return { token, ownerUid: tenant.ownerUid, slug: tenant.slug }
  }
}
