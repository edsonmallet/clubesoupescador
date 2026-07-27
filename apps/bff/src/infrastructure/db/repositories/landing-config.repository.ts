import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { LandingConfig } from '../../../domain/entities/landing-config'
import type {
  ILandingConfigRepository,
  UpsertLandingConfigDto,
} from '../../../domain/interfaces/ILandingConfigRepository'
import type { schema } from '../schema'
import { landingConfigs } from '../schema/tenants'

type LandingConfigRow = typeof landingConfigs.$inferSelect

function toDomain(row: LandingConfigRow): LandingConfig {
  return LandingConfig.create({
    id: row.id,
    tenantId: row.tenantId,
    templateId: row.templateId,
    theme: row.theme,
    sections: row.sections,
    seo: row.seo,
    published: row.published,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  })
}

const DEFAULT_TEMPLATE_ID = 'clube-simples'

export class LandingConfigRepository implements ILandingConfigRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findByTenantId(tenantId: string): Promise<LandingConfig | null> {
    const [row] = await this.db
      .select()
      .from(landingConfigs)
      .where(eq(landingConfigs.tenantId, tenantId))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async upsert(
    tenantId: string,
    data: UpsertLandingConfigDto,
  ): Promise<LandingConfig> {
    const existing = await this.findByTenantId(tenantId)

    if (!existing) {
      const [row] = await this.db
        .insert(landingConfigs)
        .values({
          tenantId,
          templateId: data.templateId ?? DEFAULT_TEMPLATE_ID,
          theme: data.theme ?? {},
          sections: data.sections ?? {},
          seo: data.seo ?? {},
          published: data.published ?? false,
          publishedAt: data.published ? new Date() : null,
        })
        .returning()

      return toDomain(row as LandingConfigRow)
    }

    const [row] = await this.db
      .update(landingConfigs)
      .set({
        templateId: data.templateId ?? existing.templateId,
        theme: data.theme ?? existing.theme,
        sections: data.sections ?? existing.sections,
        seo: data.seo ?? existing.seo,
        published: data.published ?? existing.published,
        publishedAt:
          data.published !== undefined
            ? data.published
              ? new Date()
              : null
            : existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(landingConfigs.tenantId, tenantId))
      .returning()

    return toDomain(row as LandingConfigRow)
  }
}
