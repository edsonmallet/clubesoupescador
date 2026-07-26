import { and, eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Raffle } from '../../../domain/entities/Raffle'
import type {
  CreateRaffleDto,
  IRaffleRepository,
  PaginatedResult,
  UpdateRaffleDto,
} from '../../../domain/interfaces/IRaffleRepository'
import type { schema } from '../schema'
import { raffles } from '../schema/raffles'

type RaffleRow = typeof raffles.$inferSelect

function toDomain(row: RaffleRow): Raffle {
  return Raffle.create({
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    description: row.description,
    prize: row.prize,
    imageUrl: row.imageUrl,
    ticketPriceCents: row.ticketPriceCents,
    status: row.status,
    contestNumber: row.contestNumber,
    winnerTicket: row.winnerTicket,
    winnerUid: row.winnerUid,
    drawnAt: row.drawnAt,
    createdAt: row.createdAt,
  })
}

export class RaffleRepository implements IRaffleRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findMany(
    tenantId: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Raffle>> {
    const where = eq(raffles.tenantId, tenantId)

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(raffles)
        .where(where)
        .orderBy(sql`${raffles.createdAt} desc`)
        .limit(perPage)
        .offset((page - 1) * perPage),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(raffles)
        .where(where),
    ])

    return { items: rows.map(toDomain), total: count }
  }

  async findById(tenantId: string, id: string): Promise<Raffle | null> {
    const [row] = await this.db
      .select()
      .from(raffles)
      .where(and(eq(raffles.id, id), eq(raffles.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async create(data: CreateRaffleDto): Promise<Raffle> {
    const [row] = await this.db.insert(raffles).values(data).returning()
    return toDomain(row as RaffleRow)
  }

  async update(id: string, data: UpdateRaffleDto): Promise<Raffle> {
    const [row] = await this.db
      .update(raffles)
      .set(data)
      .where(eq(raffles.id, id))
      .returning()

    return toDomain(row as RaffleRow)
  }

  async setWinner(
    id: string,
    winnerTicket: number,
    winnerUid: string,
    drawnAt: Date,
  ): Promise<Raffle> {
    const [row] = await this.db
      .update(raffles)
      .set({ winnerTicket, winnerUid, drawnAt, status: 'drawn' })
      .where(eq(raffles.id, id))
      .returning()

    return toDomain(row as RaffleRow)
  }
}
