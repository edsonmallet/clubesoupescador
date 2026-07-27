import { DomainError } from './domain-error'

export class TenantNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Tenant ${id} not found`, 'TENANT_NOT_FOUND', 404)
  }
}
