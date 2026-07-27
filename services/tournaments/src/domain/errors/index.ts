import { DomainError } from './domain-error'

export class TournamentNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Tournament ${id} not found`, 'TOURNAMENT_NOT_FOUND', 404)
  }
}

export class SubmissionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Submission ${id} not found`, 'SUBMISSION_NOT_FOUND', 404)
  }
}

export { DomainError }
