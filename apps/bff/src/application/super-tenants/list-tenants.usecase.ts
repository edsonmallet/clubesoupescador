import type { Tenant } from '../../domain/entities/tenant'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'

export type TenantWithMemberCount = {
  tenant: Tenant
  memberCount: number
}

export class ListTenantsUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(): Promise<TenantWithMemberCount[]> {
    const tenants = await this.tenantRepository.list()

    return Promise.all(
      tenants.map(async (tenant) => ({
        tenant,
        memberCount: await this.tenantRepository.countUsers(tenant.id),
      })),
    )
  }
}
