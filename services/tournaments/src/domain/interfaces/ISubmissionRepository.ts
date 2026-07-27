import type { Submission } from '../entities/Submission'

export type CreateSubmissionDto = {
  tenantId: string
  tournamentId: string
  authorUid: string
  mediaUrl: string
}

export interface ISubmissionRepository {
  create(data: CreateSubmissionDto): Promise<Submission>
  findByTournament(tenantId: string, tournamentId: string): Promise<Submission[]>
  findById(tenantId: string, id: string): Promise<Submission | null>
  setManualScore(id: string, manualScore: number): Promise<Submission>
}
