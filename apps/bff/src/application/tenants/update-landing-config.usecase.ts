import type {
  ILandingConfigRepository,
  UpsertLandingConfigDto,
} from '../../domain/interfaces/ILandingConfigRepository'
import type { LandingConfigResult } from './get-landing-config.usecase'

export class UpdateLandingConfigUseCase {
  constructor(
    private readonly landingConfigRepository: ILandingConfigRepository,
  ) {}

  async execute(
    tenantId: string,
    data: UpsertLandingConfigDto,
  ): Promise<LandingConfigResult> {
    const config = await this.landingConfigRepository.upsert(tenantId, data)

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
