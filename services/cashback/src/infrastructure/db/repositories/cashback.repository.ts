import { and, eq, gt, lte, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { CashbackEntry } from '../../../domain/entities/CashbackEntry'
import type {
  CashbackBalance,
  CreditCashbackDto,
  DebitCashbackDto,
  ICashbackRepository,
  PaginatedResult,
} from '../../../domain/interfaces/ICashbackRepository'
import type { schema } from '../schema'
import { ledger } from '../schema/cashback'

type LedgerRow = typeof ledger.$inferSelect

function toDomain(row: LedgerRow): CashbackEntry {
  return CashbackEntry.create({
    id: row.id,
    tenantId: row.tenantId,
    uid: row.uid,
    type: row.type,
    amountCents: row.amountCents,
    source: row.source,
    sourceId: row.sourceId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  })
}

export class CashbackRepository implements ICashbackRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async credit(data: CreditCashbackDto): Promise<void> {
    await this.db.insert(ledger).values({
      tenantId: data.tenantId,
      uid: data.uid,
      type: data.type,
      amountCents: data.amountCents,
      source: data.source,
      sourceId: data.sourceId,
      expiresAt: data.expiresAt,
    })
  }

  async debit(data: DebitCashbackDto): Promise<void> {
    await this.db.insert(ledger).values({
      tenantId: data.tenantId,
      uid: data.uid,
      type: data.type,
      amountCents: -Math.abs(data.amountCents),
      source: data.source,
      sourceId: data.sourceId,
      expiresAt: null,
    })
  }

  async getBalance(tenantId: string, uid: string): Promise<CashbackBalance> {
    const scope = and(eq(ledger.tenantId, tenantId), eq(ledger.uid, uid))
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [[{ available }], [{ expiringSoon }], [{ nextExpiryAt }]] =
      await Promise.all([
        this.db
          .select({
            available: sql<number>`coalesce(sum(${ledger.amountCents}), 0)::int`,
          })
          .from(ledger)
          .where(scope),
        this.db
          .select({
            expiringSoon: sql<number>`coalesce(sum(${ledger.amountCents}), 0)::int`,
          })
          .from(ledger)
          .where(
            and(
              scope,
              gt(ledger.amountCents, 0),
              gt(ledger.expiresAt, now),
              lte(ledger.expiresAt, in30Days),
            ),
          ),
        this.db
          .select({ nextExpiryAt: sql<Date | null>`min(${ledger.expiresAt})` })
          .from(ledger)
          .where(
            and(scope, gt(ledger.amountCents, 0), gt(ledger.expiresAt, now)),
          ),
      ])

    return {
      availableCents: available,
      expiringSoonCents: expiringSoon,
      nextExpiryAt,
    }
  }

  async getHistory(
    tenantId: string,
    uid: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<CashbackEntry>> {
    const where = and(eq(ledger.tenantId, tenantId), eq(ledger.uid, uid))

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(ledger)
        .where(where)
        .orderBy(sql`${ledger.createdAt} desc`)
        .limit(perPage)
        .offset((page - 1) * perPage),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(ledger)
        .where(where),
    ])

    return { items: rows.map(toDomain), total: count }
  }

  /**
   * Returns credit lots whose expiry has passed and that have no matching
   * `expired_to_xp` debit yet — the ledger is insert-only, so "already
   * processed" is determined by the presence of that offsetting row rather
   * than a status flag on the credit row itself.
   */
  async getExpiring(before: Date): Promise<CashbackEntry[]> {
    const rows = await this.db
      .select()
      .from(ledger)
      .where(
        and(
          gt(ledger.amountCents, 0),
          lte(ledger.expiresAt, before),
          sql`not exists (
            select 1 from ${ledger} as expired
            where expired.type = 'expired_to_xp'
              and expired.source_id = ${ledger.id}::text
          )`,
        ),
      )

    return rows.map(toDomain)
  }
}
