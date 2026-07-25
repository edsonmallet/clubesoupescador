import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Plan } from '../../../domain/entities/plan'
import type { IPlanRepository } from '../../../domain/interfaces/IPlanRepository'
import type { schema } from '../schema'
import { plans } from '../schema/subscriptions'

type PlanRow = typeof plans.$inferSelect

function toDomain(row: PlanRow): Plan {
  return Plan.create({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    priceCents: row.priceCents,
    active: row.active,
    createdAt: row.createdAt,
  })
}

export class PlanRepository implements IPlanRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findActiveByTenant(tenantId: string): Promise<Plan[]> {
    const rows = await this.db
      .select()
      .from(plans)
      .where(and(eq(plans.tenantId, tenantId), eq(plans.active, true)))

    return rows.map(toDomain)
  }

  async findById(id: string): Promise<Plan | null> {
    const [row] = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1)

    return row ? toDomain(row) : null
  }
}
