import { and, eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type {
  Emoji,
  IReactionRepository,
  ReactionCounts,
  ReactionTargetType,
} from '../../../domain/interfaces/IReactionRepository'
import type { schema } from '../schema'
import { reactions } from '../schema/community'

export class ReactionRepository implements IReactionRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async exists(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
    uid: string,
    emoji: Emoji,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ id: reactions.id })
      .from(reactions)
      .where(
        and(
          eq(reactions.tenantId, tenantId),
          eq(reactions.targetType, targetType),
          eq(reactions.targetId, targetId),
          eq(reactions.uid, uid),
          eq(reactions.emoji, emoji),
        ),
      )
      .limit(1)

    return Boolean(row)
  }

  async add(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
    uid: string,
    emoji: Emoji,
  ): Promise<void> {
    await this.db
      .insert(reactions)
      .values({ tenantId, targetType, targetId, uid, emoji })
      .onConflictDoNothing()
  }

  async remove(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
    uid: string,
    emoji: Emoji,
  ): Promise<void> {
    await this.db
      .delete(reactions)
      .where(
        and(
          eq(reactions.tenantId, tenantId),
          eq(reactions.targetType, targetType),
          eq(reactions.targetId, targetId),
          eq(reactions.uid, uid),
          eq(reactions.emoji, emoji),
        ),
      )
  }

  async countsByTarget(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<ReactionCounts> {
    const rows = await this.db
      .select({ emoji: reactions.emoji, count: sql<number>`count(*)::int` })
      .from(reactions)
      .where(
        and(
          eq(reactions.tenantId, tenantId),
          eq(reactions.targetType, targetType),
          eq(reactions.targetId, targetId),
        ),
      )
      .groupBy(reactions.emoji)

    return Object.fromEntries(rows.map((row) => [row.emoji, row.count]))
  }

  async findByUser(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
    uid: string,
  ): Promise<Emoji[]> {
    const rows = await this.db
      .select({ emoji: reactions.emoji })
      .from(reactions)
      .where(
        and(
          eq(reactions.tenantId, tenantId),
          eq(reactions.targetType, targetType),
          eq(reactions.targetId, targetId),
          eq(reactions.uid, uid),
        ),
      )

    return rows.map((row) => row.emoji as Emoji)
  }
}
