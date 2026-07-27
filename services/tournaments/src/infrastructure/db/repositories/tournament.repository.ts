import { and, eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Tournament, type TournamentStatus } from '../../../domain/entities/Tournament'
import type {
  CreateTournamentDto,
  ITournamentRepository,
  PaginatedResult,
} from '../../../domain/interfaces/ITournamentRepository'
import type { schema } from '../schema'
import { tournaments } from '../schema/tournaments'

type TournamentRow = typeof tournaments.$inferSelect

function toDomain(row: TournamentRow): Tournament {
  return Tournament.create({
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt,
  })
}

export class TournamentRepository implements ITournamentRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async create(data: CreateTournamentDto): Promise<Tournament> {
    const [row] = await this.db.insert(tournaments).values(data).returning()
    return toDomain(row as TournamentRow)
  }

  async findMany(
    tenantId: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Tournament>> {
    const where = eq(tournaments.tenantId, tenantId)

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(tournaments)
        .where(where)
        .orderBy(sql`${tournaments.createdAt} desc`)
        .limit(perPage)
        .offset((page - 1) * perPage),
      this.db.select({ count: sql<number>`count(*)::int` }).from(tournaments).where(where),
    ])

    return { items: rows.map(toDomain), total: count }
  }

  async findById(tenantId: string, id: string): Promise<Tournament | null> {
    const [row] = await this.db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.id, id), eq(tournaments.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async updateStatus(id: string, status: TournamentStatus): Promise<Tournament> {
    const [row] = await this.db
      .update(tournaments)
      .set({ status })
      .where(eq(tournaments.id, id))
      .returning()

    return toDomain(row as TournamentRow)
  }
}
