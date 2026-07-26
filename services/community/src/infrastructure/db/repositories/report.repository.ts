import { eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type {
  CreateReportDto,
  IReportRepository,
  PaginatedResult,
  Report,
  ReportStatus,
  ReportTargetType,
} from '../../../domain/interfaces/IReportRepository'
import type { schema } from '../schema'
import { reports } from '../schema/community'

type ReportRow = typeof reports.$inferSelect

function toDomain(row: ReportRow): Report {
  return {
    id: row.id,
    tenantId: row.tenantId,
    targetType: row.targetType as ReportTargetType,
    targetId: row.targetId,
    reporterUid: row.reporterUid,
    reason: row.reason,
    status: row.status,
    createdAt: row.createdAt,
  }
}

export class ReportRepository implements IReportRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async create(data: CreateReportDto): Promise<Report> {
    const [row] = await this.db.insert(reports).values(data).returning()
    return toDomain(row as ReportRow)
  }

  async findMany(
    tenantId: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Report>> {
    const where = eq(reports.tenantId, tenantId)

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(reports)
        .where(where)
        .orderBy(sql`${reports.createdAt} desc`)
        .limit(perPage)
        .offset((page - 1) * perPage),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(reports)
        .where(where),
    ])

    return { items: rows.map(toDomain), total: count }
  }

  async updateStatus(id: string, status: ReportStatus): Promise<Report> {
    const [row] = await this.db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning()

    return toDomain(row as ReportRow)
  }
}
