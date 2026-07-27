import type { IDomainRepository } from '../../domain/interfaces/IDomainRepository'
import type { DomainResult } from './list-domains.usecase'

function toResult(domain: {
  id: string
  domain: string
  type: 'subdomain' | 'custom'
  verified: boolean
  verifiedAt: Date | null
  lastError: string | null
  createdAt: Date
}): DomainResult {
  return {
    id: domain.id,
    domain: domain.domain,
    type: domain.type,
    verified: domain.verified,
    verifiedAt: domain.verifiedAt?.toISOString() ?? null,
    lastError: domain.lastError,
    createdAt: domain.createdAt.toISOString(),
  }
}

export class AddDomainUseCase {
  constructor(private readonly domainRepository: IDomainRepository) {}

  async execute(tenantId: string, domain: string): Promise<DomainResult> {
    const created = await this.domainRepository.create({ tenantId, domain })
    return toResult(created)
  }
}
