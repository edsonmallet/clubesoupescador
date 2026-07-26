import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type {
  IVoteRepository,
  Vote,
  VoteTargetType,
  VoteValue,
} from '../../../domain/interfaces/IVoteRepository'
import type { schema } from '../schema'
import { votes } from '../schema/community'

type VoteRow = typeof votes.$inferSelect

function toDomain(row: VoteRow): Vote {
  return {
    id: row.id,
    tenantId: row.tenantId,
    targetType: row.targetType as VoteTargetType,
    targetId: row.targetId,
    uid: row.uid,
    value: row.value as VoteValue,
  }
}

export class VoteRepository implements IVoteRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findExisting(
    tenantId: string,
    targetType: VoteTargetType,
    targetId: string,
    uid: string,
  ): Promise<Vote | null> {
    const [row] = await this.db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.tenantId, tenantId),
          eq(votes.targetType, targetType),
          eq(votes.targetId, targetId),
          eq(votes.uid, uid),
        ),
      )
      .limit(1)

    return row ? toDomain(row) : null
  }

  async create(
    tenantId: string,
    targetType: VoteTargetType,
    targetId: string,
    uid: string,
    value: VoteValue,
  ): Promise<void> {
    await this.db
      .insert(votes)
      .values({ tenantId, targetType, targetId, uid, value })
  }

  async updateValue(id: string, value: VoteValue): Promise<void> {
    await this.db.update(votes).set({ value }).where(eq(votes.id, id))
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(votes).where(eq(votes.id, id))
  }
}
