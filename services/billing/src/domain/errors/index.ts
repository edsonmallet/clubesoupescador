import { DomainError } from './domain-error'

export class PlanNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Plan ${id} not found`, 'PLAN_NOT_FOUND', 404)
  }
}

export class TenantBillingAlreadyActiveError extends DomainError {
  constructor(tenantId: string) {
    super(
      `Tenant billing for ${tenantId} is already active`,
      'TENANT_BILLING_ALREADY_ACTIVE',
      409,
    )
  }
}
