import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Submission } from '../../../domain/entities/Submission'
import type {
  CreateSubmissionDto,
  ISubmissionRepository,
} from '../../../domain/interfaces/ISubmissionRepository'
import type { schema } from '../schema'
import { submissions } from '../schema/tournaments'

type SubmissionRow = typeof submissions.$inferSelect

function toDomain(row: SubmissionRow): Submission {
  return Submission.create({
    id: row.id,
    tenantId: row.tenantId,
    tournamentId: row.tournamentId,
    authorUid: row.authorUid,
    mediaUrl: row.mediaUrl,
    voteScore: row.voteScore,
    manualScore: row.manualScore,
    createdAt: row.createdAt,
  })
}

export class SubmissionRepository implements ISubmissionRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async create(data: CreateSubmissionDto): Promise<Submission> {
    const [row] = await this.db.insert(submissions).values(data).returning()
    return toDomain(row as SubmissionRow)
  }

  async findByTournament(tenantId: string, tournamentId: string): Promise<Submission[]> {
    const rows = await this.db
      .select()
      .from(submissions)
      .where(
        and(eq(submissions.tenantId, tenantId), eq(submissions.tournamentId, tournamentId)),
      )
      .orderBy(submissions.createdAt)

    return rows.map(toDomain)
  }

  async findById(tenantId: string, id: string): Promise<Submission | null> {
    const [row] = await this.db
      .select()
      .from(submissions)
      .where(and(eq(submissions.id, id), eq(submissions.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async setManualScore(id: string, manualScore: number): Promise<Submission> {
    const [row] = await this.db
      .update(submissions)
      .set({ manualScore })
      .where(eq(submissions.id, id))
      .returning()

    return toDomain(row as SubmissionRow)
  }
}
