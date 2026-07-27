import { sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { schema } from '../schema'
import { plans, subscribers } from '../schema/subscriptions'

export type SubscriptionsSummary = {
  activeMembers: number
  monthlyRevenueCents: number
  signupsByDay: Array<{ date: string; count: number }>
}

/**
 * Read-only aggregate queries for the admin dashboard/financial screens —
 * kept as a dedicated repository rather than bolted onto SubscriptionRepository
 * since these are reporting queries, not part of the subscription lifecycle.
 */
export class DashboardRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async getSummary(tenantId: string): Promise<SubscriptionsSummary> {
    const [[{ activeMembers }], [{ monthlyRevenueCents }], signupRows] = await Promise.all([
      this.db
        .select({ activeMembers: sql<number>`count(*)::int` })
        .from(subscribers)
        .where(sql`${subscribers.tenantId} = ${tenantId} and ${subscribers.status} = 'active'`),
      this.db
        .select({
          monthlyRevenueCents: sql<number>`coalesce(sum(${plans.priceCents}), 0)::int`,
        })
        .from(subscribers)
        .innerJoin(plans, sql`${plans.id} = ${subscribers.planId}`)
        .where(sql`${subscribers.tenantId} = ${tenantId} and ${subscribers.status} = 'active'`),
      this.db
        .select({
          date: sql<string>`to_char(${subscribers.createdAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(subscribers)
        .where(
          sql`${subscribers.tenantId} = ${tenantId} and ${subscribers.createdAt} >= now() - interval '30 days'`,
        )
        .groupBy(sql`to_char(${subscribers.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${subscribers.createdAt}, 'YYYY-MM-DD')`),
    ])

    return { activeMembers, monthlyRevenueCents, signupsByDay: signupRows }
  }
}
