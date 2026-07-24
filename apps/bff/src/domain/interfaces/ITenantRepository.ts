import type { Tenant } from '../entities/tenant'

export type CreateTenantDto = {
  slug: string
  name: string
  ownerUid: string
  logoUrl?: string | null
  planId?: string | null
  settings?: Record<string, unknown>
}

export interface ITenantRepository {
  findBySlug(slug: string): Promise<Tenant | null>
  findByDomain(domain: string): Promise<Tenant | null>
  create(data: CreateTenantDto): Promise<Tenant>
}
