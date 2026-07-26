import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type {
  CashbackConfig,
  ICashbackConfigRepository,
} from '../../../domain/interfaces/ICashbackConfigRepository'
import type { schema } from '../schema'
import { config } from '../schema/cashback'

type ConfigRow = typeof config.$inferSelect

function toDomain(row: ConfigRow): CashbackConfig {
  return {
    tenantId: row.tenantId,
    source: row.source,
    pct: Number(row.pct),
    expiryMonths: row.expiryMonths,
  }
}

export class CashbackConfigRepository implements ICashbackConfigRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findBySource(
    tenantId: string,
    source: string,
  ): Promise<CashbackConfig | null> {
    const [row] = await this.db
      .select()
      .from(config)
      .where(and(eq(config.tenantId, tenantId), eq(config.source, source)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findAll(tenantId: string): Promise<CashbackConfig[]> {
    const rows = await this.db
      .select()
      .from(config)
      .where(eq(config.tenantId, tenantId))

    return rows.map(toDomain)
  }

  async upsert(data: CashbackConfig): Promise<CashbackConfig> {
    const [row] = await this.db
      .insert(config)
      .values({
        tenantId: data.tenantId,
        source: data.source,
        pct: data.pct.toString(),
        expiryMonths: data.expiryMonths,
      })
      .onConflictDoUpdate({
        target: [config.tenantId, config.source],
        set: { pct: data.pct.toString(), expiryMonths: data.expiryMonths },
      })
      .returning()

    return toDomain(row as ConfigRow)
  }
}
