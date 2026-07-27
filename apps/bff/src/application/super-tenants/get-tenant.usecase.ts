import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import type { TenantWithMemberCount } from './list-tenants.usecase'

export class GetTenantUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(id: string): Promise<TenantWithMemberCount> {
    const tenant = await this.tenantRepository.findById(id)
    if (!tenant) {
      throw new TenantNotFoundError(id)
    }

    const memberCount = await this.tenantRepository.countUsers(id)
    return { tenant, memberCount }
  }
}
