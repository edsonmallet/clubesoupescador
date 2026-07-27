import { and, eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Subscription } from '../../../domain/entities/subscription'
import type { SubscriptionStatus } from '../../../domain/entities/subscription'
import type {
  CreateSubscriptionDto,
  ISubscriptionRepository,
  PaginatedResult,
  UpdateAsaasDetailsDto,
} from '../../../domain/interfaces/ISubscriptionRepository'
import type { schema } from '../schema'
import { subscribers } from '../schema/subscriptions'

type SubscriberRow = typeof subscribers.$inferSelect

function toDomain(row: SubscriberRow): Subscription {
  return Subscription.create({
    id: row.id,
    tenantId: row.tenantId,
    uid: row.uid,
    planId: row.planId,
    asaasCustomerId: row.asaasCustomerId,
    asaasSubscriptionId: row.asaasSubscriptionId,
    status: row.status,
    totalXp: row.totalXp,
    levelId: row.levelId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findByUid(uid: string, tenantId: string): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscribers)
      .where(and(eq(subscribers.uid, uid), eq(subscribers.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findByAsaasSubscriptionId(
    asaasSubscriptionId: string,
  ): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscribers)
      .where(eq(subscribers.asaasSubscriptionId, asaasSubscriptionId))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findById(id: string): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscribers)
      .where(eq(subscribers.id, id))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findMany(
    tenantId: string,
    page: number,
    perPage: number,
    status?: SubscriptionStatus,
  ): Promise<PaginatedResult<Subscription>> {
    const conditions = [eq(subscribers.tenantId, tenantId)]
    if (status) conditions.push(eq(subscribers.status, status))
    const where = and(...conditions)

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(subscribers)
        .where(where)
        .orderBy(sql`${subscribers.createdAt} desc`)
        .limit(perPage)
        .offset((page - 1) * perPage),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(subscribers)
        .where(where),
    ])

    return { items: rows.map(toDomain), total: count }
  }

  async create(data: CreateSubscriptionDto): Promise<Subscription> {
    const [row] = await this.db
      .insert(subscribers)
      .values({
        tenantId: data.tenantId,
        uid: data.uid,
        planId: data.planId,
        asaasCustomerId: data.asaasCustomerId,
        asaasSubscriptionId: data.asaasSubscriptionId,
        status: data.status,
      })
      .returning()

    return toDomain(row as SubscriberRow)
  }

  async updateStatus(
    id: string,
    status: SubscriptionStatus,
  ): Promise<Subscription> {
    const [row] = await this.db
      .update(subscribers)
      .set({ status, updatedAt: new Date() })
      .where(eq(subscribers.id, id))
      .returning()

    return toDomain(row as SubscriberRow)
  }

  async updateAsaasDetails(
    id: string,
    data: UpdateAsaasDetailsDto,
  ): Promise<Subscription> {
    const [row] = await this.db
      .update(subscribers)
      .set({
        planId: data.planId,
        asaasCustomerId: data.asaasCustomerId,
        asaasSubscriptionId: data.asaasSubscriptionId,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(subscribers.id, id))
      .returning()

    return toDomain(row as SubscriberRow)
  }

  async updateXp(
    id: string,
    totalXp: number,
    levelId: string | null,
  ): Promise<Subscription> {
    const [row] = await this.db
      .update(subscribers)
      .set({ totalXp, levelId, updatedAt: new Date() })
      .where(eq(subscribers.id, id))
      .returning()

    return toDomain(row as SubscriberRow)
  }
}
