import type { Tournament, TournamentStatus } from '../entities/Tournament'

export type CreateTournamentDto = {
  tenantId: string
  title: string
  description: string
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
}

export interface ITournamentRepository {
  create(data: CreateTournamentDto): Promise<Tournament>
  findMany(
    tenantId: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Tournament>>
  findById(tenantId: string, id: string): Promise<Tournament | null>
  updateStatus(id: string, status: TournamentStatus): Promise<Tournament>
}
