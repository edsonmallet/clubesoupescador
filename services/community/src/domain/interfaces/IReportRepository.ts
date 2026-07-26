export type ReportTargetType = 'topic' | 'comment'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

export type Report = {
  id: string
  tenantId: string
  targetType: ReportTargetType
  targetId: string
  reporterUid: string
  reason: string
  status: ReportStatus
  createdAt: Date
}

export type CreateReportDto = {
  tenantId: string
  targetType: ReportTargetType
  targetId: string
  reporterUid: string
  reason: string
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
}

export interface IReportRepository {
  create(data: CreateReportDto): Promise<Report>
  findMany(
    tenantId: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Report>>
  updateStatus(id: string, status: ReportStatus): Promise<Report>
}
