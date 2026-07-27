import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type {
  IXpConfigRepository,
  XpConfig,
} from '../../../domain/interfaces/IXpConfigRepository'
import type { schema } from '../schema'
import { xpConfig } from '../schema/subscriptions'

type XpConfigRow = typeof xpConfig.$inferSelect

function toDomain(row: XpConfigRow): XpConfig {
  return {
    tenantId: row.tenantId,
    source: row.source,
    points: row.points,
    dailyCap: row.dailyCap,
  }
}

export class XpConfigRepository implements IXpConfigRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findAll(tenantId: string): Promise<XpConfig[]> {
    const rows = await this.db.select().from(xpConfig).where(eq(xpConfig.tenantId, tenantId))
    return rows.map(toDomain)
  }

  async upsert(data: XpConfig): Promise<XpConfig> {
    const [row] = await this.db
      .insert(xpConfig)
      .values(data)
      .onConflictDoUpdate({
        target: [xpConfig.tenantId, xpConfig.source],
        set: { points: data.points, dailyCap: data.dailyCap },
      })
      .returning()

    return toDomain(row as XpConfigRow)
  }
}
