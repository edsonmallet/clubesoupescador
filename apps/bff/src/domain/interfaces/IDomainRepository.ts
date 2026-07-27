import type { Domain } from '../entities/domain'

export type CreateDomainDto = {
  tenantId: string
  domain: string
}

export type UpdateDomainVerificationDto = {
  verified: boolean
  verifiedAt: Date | null
  lastError: string | null
}

export interface IDomainRepository {
  findByTenantId(tenantId: string): Promise<Domain[]>
  findById(id: string): Promise<Domain | null>
  create(data: CreateDomainDto): Promise<Domain>
  updateVerification(
    id: string,
    data: UpdateDomainVerificationDto,
  ): Promise<Domain>
}
