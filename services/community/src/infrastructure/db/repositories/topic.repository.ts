import { and, eq, gt, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Topic } from '../../../domain/entities/Topic'
import type {
  CreateTopicDto,
  ITopicRepository,
  PaginatedResult,
  TopicSort,
  UpdateTopicDto,
} from '../../../domain/interfaces/ITopicRepository'
import type { schema } from '../schema'
import { topics } from '../schema/community'

type TopicRow = typeof topics.$inferSelect

function toDomain(row: TopicRow): Topic {
  return Topic.create({
    id: row.id,
    tenantId: row.tenantId,
    categoryId: row.categoryId,
    authorUid: row.authorUid,
    title: row.title,
    body: row.body,
    pinned: row.pinned,
    locked: row.locked,
    deleted: row.deleted,
    voteScore: row.voteScore,
    commentCount: row.commentCount,
    createdAt: row.createdAt,
  })
}

// Mirrors the pure `hotScore()` formula (application/topics/list-topics.usecase.ts)
// as a SQL expression so "hot" ordering can be paginated in the database
// instead of loading every topic into memory to sort.
const HOT_SCORE_SQL = sql`${topics.voteScore} / power(extract(epoch from (now() - ${topics.createdAt})) / 3600 + 2, 1.5)`

export class TopicRepository implements ITopicRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async create(data: CreateTopicDto): Promise<Topic> {
    const [row] = await this.db.insert(topics).values(data).returning()
    return toDomain(row as TopicRow)
  }

  async findById(tenantId: string, id: string): Promise<Topic | null> {
    const [row] = await this.db
      .select()
      .from(topics)
      .where(and(eq(topics.id, id), eq(topics.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findMany(
    tenantId: string,
    categoryId: string | null,
    sort: TopicSort,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Topic>> {
    const conditions = [
      eq(topics.tenantId, tenantId),
      eq(topics.deleted, false),
    ]
    if (categoryId) conditions.push(eq(topics.categoryId, categoryId))
    // "rising" has no vote time-series to compute real momentum from, so it
    // approximates "gaining traction" as posts from the last 24h ranked by
    // score — a documented simplification, not true velocity.
    if (sort === 'rising') {
      conditions.push(gt(topics.createdAt, sql`now() - interval '24 hours'`))
    }
    const where = and(...conditions)

    const orderBy =
      sort === 'new'
        ? sql`${topics.createdAt} desc`
        : sort === 'top'
          ? sql`${topics.voteScore} desc`
          : sql`${HOT_SCORE_SQL} desc`

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(topics)
        .where(where)
        .orderBy(sql`${topics.pinned} desc`, orderBy)
        .limit(perPage)
        .offset((page - 1) * perPage),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(topics)
        .where(where),
    ])

    return { items: rows.map(toDomain), total: count }
  }

  async update(id: string, data: UpdateTopicDto): Promise<Topic> {
    const [row] = await this.db
      .update(topics)
      .set(data)
      .where(eq(topics.id, id))
      .returning()

    return toDomain(row as TopicRow)
  }

  async incrementCommentCount(id: string, delta: number): Promise<void> {
    await this.db
      .update(topics)
      .set({ commentCount: sql`${topics.commentCount} + ${delta}` })
      .where(eq(topics.id, id))
  }

  async updateVoteScore(id: string, delta: number): Promise<void> {
    await this.db
      .update(topics)
      .set({ voteScore: sql`${topics.voteScore} + ${delta}` })
      .where(eq(topics.id, id))
  }
}
