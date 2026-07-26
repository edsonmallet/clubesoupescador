import { and, eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Comment } from '../../../domain/entities/Comment'
import type {
  CreateCommentDto,
  ICommentRepository,
} from '../../../domain/interfaces/ICommentRepository'
import type { schema } from '../schema'
import { comments } from '../schema/community'

type CommentRow = typeof comments.$inferSelect

function toDomain(row: CommentRow): Comment {
  return Comment.create({
    id: row.id,
    tenantId: row.tenantId,
    topicId: row.topicId,
    authorUid: row.authorUid,
    parentId: row.parentId,
    depth: row.depth,
    body: row.body,
    voteScore: row.voteScore,
    deleted: row.deleted,
    createdAt: row.createdAt,
  })
}

export class CommentRepository implements ICommentRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async create(data: CreateCommentDto): Promise<Comment> {
    const [row] = await this.db.insert(comments).values(data).returning()
    return toDomain(row as CommentRow)
  }

  async findById(tenantId: string, id: string): Promise<Comment | null> {
    const [row] = await this.db
      .select()
      .from(comments)
      .where(and(eq(comments.id, id), eq(comments.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findByTopic(tenantId: string, topicId: string): Promise<Comment[]> {
    const rows = await this.db
      .select()
      .from(comments)
      .where(
        and(eq(comments.tenantId, tenantId), eq(comments.topicId, topicId)),
      )
      .orderBy(comments.createdAt)

    return rows.map(toDomain)
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(comments)
      .set({ deleted: true })
      .where(eq(comments.id, id))
  }

  async updateVoteScore(id: string, delta: number): Promise<void> {
    await this.db
      .update(comments)
      .set({ voteScore: sql`${comments.voteScore} + ${delta}` })
      .where(eq(comments.id, id))
  }
}
