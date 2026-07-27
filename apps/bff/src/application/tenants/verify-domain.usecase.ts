import { resolveCname } from 'node:dns/promises'
import { DomainNotFoundError } from '../../domain/errors/domain-not-found.error'
import type { IDomainRepository } from '../../domain/interfaces/IDomainRepository'
import type { DomainResult } from './list-domains.usecase'

const EXPECTED_CNAME_TARGET = 'proxy.clube.com.br'

export class VerifyDomainUseCase {
  constructor(private readonly domainRepository: IDomainRepository) {}

  async execute(id: string): Promise<DomainResult> {
    const domain = await this.domainRepository.findById(id)
    if (!domain) throw new DomainNotFoundError(id)

    let verified = false
    let lastError: string | null = null

    try {
      const records = await resolveCname(domain.domain)
      verified = records.some(
        (record) => record.toLowerCase() === EXPECTED_CNAME_TARGET,
      )
      if (!verified) {
        lastError = `CNAME não aponta para ${EXPECTED_CNAME_TARGET}`
      }
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : 'Falha ao resolver DNS'
    }

    const updated = await this.domainRepository.updateVerification(id, {
      verified,
      verifiedAt: verified ? new Date() : domain.verifiedAt,
      lastError,
    })

    return {
      id: updated.id,
      domain: updated.domain,
      type: updated.type,
      verified: updated.verified,
      verifiedAt: updated.verifiedAt?.toISOString() ?? null,
      lastError: updated.lastError,
      createdAt: updated.createdAt.toISOString(),
    }
  }
}
