import { and, eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Ticket } from '../../../domain/entities/Ticket'
import { TicketsSoldOutError } from '../../../domain/errors'
import type {
  AllocateTicketsDto,
  ITicketRepository,
} from '../../../domain/interfaces/ITicketRepository'
import type { schema } from '../schema'
import { tickets } from '../schema/raffles'

type TicketRow = typeof tickets.$inferSelect

function toDomain(row: TicketRow): Ticket {
  return Ticket.create({
    id: row.id,
    tenantId: row.tenantId,
    raffleId: row.raffleId,
    uid: row.uid,
    number: row.number,
    status: row.status,
    source: row.source,
    asaasPaymentId: row.asaasPaymentId,
    createdAt: row.createdAt,
  })
}

export class TicketRepository implements ITicketRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  /**
   * `pg_advisory_xact_lock` serializes concurrent allocations for the same
   * raffle for the lifetime of the transaction — without it, two joins
   * reading `max(number)` at the same time could both compute the same next
   * number and collide against the `tickets_raffle_number_idx` unique index
   * (or worse, silently allocate overlapping ranges on databases without
   * that index enforced).
   */
  async allocate(data: AllocateTicketsDto): Promise<Ticket[]> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${data.raffleId}))`,
      )

      const [{ max }] = await tx
        .select({ max: sql<number>`coalesce(max(${tickets.number}), 0)::int` })
        .from(tickets)
        .where(eq(tickets.raffleId, data.raffleId))

      if (data.maxTickets !== null && max + data.qty > data.maxTickets) {
        throw new TicketsSoldOutError(data.raffleId)
      }

      const values = Array.from({ length: data.qty }, (_, index) => ({
        tenantId: data.tenantId,
        raffleId: data.raffleId,
        uid: data.uid,
        number: max + index + 1,
        status: data.status,
        source: data.source,
        asaasPaymentId: data.asaasPaymentId,
      }))

      const rows = await tx.insert(tickets).values(values).returning()
      return rows.map(toDomain)
    })
  }

  async findByUidAndRaffle(
    tenantId: string,
    raffleId: string,
    uid: string,
  ): Promise<Ticket[]> {
    const rows = await this.db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.raffleId, raffleId),
          eq(tickets.uid, uid),
        ),
      )
      .orderBy(tickets.number)

    return rows.map(toDomain)
  }

  async hasJoinedBySource(
    tenantId: string,
    raffleId: string,
    uid: string,
    source: AllocateTicketsDto['source'],
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ id: tickets.id })
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.raffleId, raffleId),
          eq(tickets.uid, uid),
          eq(tickets.source, source),
        ),
      )
      .limit(1)

    return Boolean(row)
  }

  async findConfirmedByRaffle(
    tenantId: string,
    raffleId: string,
  ): Promise<Ticket[]> {
    const rows = await this.db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.raffleId, raffleId),
          eq(tickets.status, 'confirmed'),
        ),
      )
      .orderBy(tickets.number)

    return rows.map(toDomain)
  }

  async confirmByAsaasPaymentId(asaasPaymentId: string): Promise<Ticket[]> {
    const rows = await this.db
      .update(tickets)
      .set({ status: 'confirmed' })
      .where(eq(tickets.asaasPaymentId, asaasPaymentId))
      .returning()

    return rows.map(toDomain)
  }
}
