import type { Tenant } from '../../domain/entities/tenant'
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'

export type UpdateTenantBillingDto = {
  status: 'active' | 'suspended'
  planId?: string
}

/**
 * Called by the internal route hit from services/billing's webhook flow
 * (PAYMENT_CONFIRMED / PAYMENT_OVERDUE) — never by end users. Billing owns
 * the SaaS payment lifecycle but never touches the `tenants` schema
 * directly, so it PATCHes this instead (see CLAUDE.md: "nunca acesse schema
 * de outro serviço via banco").
 */
export class UpdateTenantBillingUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(id: string, data: UpdateTenantBillingDto): Promise<Tenant> {
    const existing = await this.tenantRepository.findById(id)
    if (!existing) {
      throw new TenantNotFoundError(id)
    }

    let tenant = await this.tenantRepository.updateStatus(id, data.status)

    if (data.planId) {
      tenant = await this.tenantRepository.updatePlan(id, data.planId)
    }

    return tenant
  }
}
