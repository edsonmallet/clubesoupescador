import type { TemplateId } from '../../domain/entities/landing-config'
import type { ILandingConfigRepository } from '../../domain/interfaces/ILandingConfigRepository'

export type LandingConfigResult = {
  templateId: TemplateId
  theme: Record<string, unknown>
  sections: Record<string, unknown>
  seo: Record<string, unknown>
  published: boolean
  publishedAt: string | null
  updatedAt: string | null
}

const DEFAULT_RESULT: LandingConfigResult = {
  templateId: 'clube-simples',
  theme: {},
  sections: {},
  seo: {},
  published: false,
  publishedAt: null,
  updatedAt: null,
}

export class GetLandingConfigUseCase {
  constructor(
    private readonly landingConfigRepository: ILandingConfigRepository,
  ) {}

  async execute(tenantId: string): Promise<LandingConfigResult> {
    const config = await this.landingConfigRepository.findByTenantId(tenantId)
    if (!config) return DEFAULT_RESULT

    return {
      templateId: config.templateId,
      theme: config.theme,
      sections: config.sections,
      seo: config.seo,
      published: config.published,
      publishedAt: config.publishedAt?.toISOString() ?? null,
      updatedAt: config.updatedAt.toISOString(),
    }
  }
}
