import { desc, eq, lte } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Level } from '../../../domain/entities/level'
import type { ILevelRepository } from '../../../domain/interfaces/ILevelRepository'
import type { schema } from '../schema'
import { levels } from '../schema/subscriptions'

type LevelRow = typeof levels.$inferSelect

function toDomain(row: LevelRow): Level {
  return Level.create({
    id: row.id,
    name: row.name,
    minXp: row.minXp,
    storeDiscountPct: Number(row.storeDiscountPct),
    cashbackPct: Number(row.cashbackPct),
  })
}

export class LevelRepository implements ILevelRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findAll(): Promise<Level[]> {
    const rows = await this.db.select().from(levels).orderBy(levels.minXp)
    return rows.map(toDomain)
  }

  async findById(id: string): Promise<Level | null> {
    const [row] = await this.db
      .select()
      .from(levels)
      .where(eq(levels.id, id))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findHighestForXp(totalXp: number): Promise<Level | null> {
    const [row] = await this.db
      .select()
      .from(levels)
      .where(lte(levels.minXp, totalXp))
      .orderBy(desc(levels.minXp))
      .limit(1)

    return row ? toDomain(row) : null
  }
}
