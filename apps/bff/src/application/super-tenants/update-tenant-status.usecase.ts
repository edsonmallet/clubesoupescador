import type { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'

export class UpdateTenantStatusUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(id: string, status: 'active' | 'suspended'): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(id)
    if (!tenant) {
      throw new TenantNotFoundError(id)
    }

    return this.tenantRepository.updateStatus(id, status)
  }
}
