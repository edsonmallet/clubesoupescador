import { DomainError } from './domain-error'

export class DomainNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Domain ${id} not found`, 'DOMAIN_NOT_FOUND', 404)
  }
}
