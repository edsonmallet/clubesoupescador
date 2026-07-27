import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { SaasPlan } from '../../../domain/entities/saas-plan'
import type {
  CreateSaasPlanDto,
  ISaasPlanRepository,
  UpdateSaasPlanDto,
} from '../../../domain/interfaces/ISaasPlanRepository'
import type { schema } from '../schema'
import { saasPlans } from '../schema/billing'

type SaasPlanRow = typeof saasPlans.$inferSelect

function toDomain(row: SaasPlanRow): SaasPlan {
  return SaasPlan.create({
    id: row.id,
    name: row.name,
    priceCents: row.priceCents,
    active: row.active,
    createdAt: row.createdAt,
  })
}

export class SaasPlanRepository implements ISaasPlanRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async list(): Promise<SaasPlan[]> {
    const rows = await this.db.select().from(saasPlans)
    return rows.map(toDomain)
  }

  async findById(id: string): Promise<SaasPlan | null> {
    const [row] = await this.db
      .select()
      .from(saasPlans)
      .where(eq(saasPlans.id, id))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async create(data: CreateSaasPlanDto): Promise<SaasPlan> {
    const [row] = await this.db
      .insert(saasPlans)
      .values({
        name: data.name,
        priceCents: data.priceCents,
        active: data.active,
      })
      .returning()

    return toDomain(row as SaasPlanRow)
  }

  async update(id: string, data: UpdateSaasPlanDto): Promise<SaasPlan> {
    const [row] = await this.db
      .update(saasPlans)
      .set(data)
      .where(eq(saasPlans.id, id))
      .returning()

    return toDomain(row as SaasPlanRow)
  }
}
