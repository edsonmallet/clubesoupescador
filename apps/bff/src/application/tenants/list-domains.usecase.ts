import type { DomainType } from '../../domain/entities/domain'
import type { IDomainRepository } from '../../domain/interfaces/IDomainRepository'

export type DomainResult = {
  id: string
  domain: string
  type: DomainType
  verified: boolean
  verifiedAt: string | null
  lastError: string | null
  createdAt: string
}

export class ListDomainsUseCase {
  constructor(private readonly domainRepository: IDomainRepository) {}

  async execute(tenantId: string): Promise<DomainResult[]> {
    const domains = await this.domainRepository.findByTenantId(tenantId)

    return domains.map((domain) => ({
      id: domain.id,
      domain: domain.domain,
      type: domain.type,
      verified: domain.verified,
      verifiedAt: domain.verifiedAt?.toISOString() ?? null,
      lastError: domain.lastError,
      createdAt: domain.createdAt.toISOString(),
    }))
  }
}
