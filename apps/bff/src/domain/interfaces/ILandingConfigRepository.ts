import type { LandingConfig, TemplateId } from '../entities/landing-config'

export type UpsertLandingConfigDto = {
  templateId?: TemplateId
  theme?: Record<string, unknown>
  sections?: Record<string, unknown>
  seo?: Record<string, unknown>
  published?: boolean
}

export interface ILandingConfigRepository {
  findByTenantId(tenantId: string): Promise<LandingConfig | null>
  upsert(tenantId: string, data: UpsertLandingConfigDto): Promise<LandingConfig>
}
