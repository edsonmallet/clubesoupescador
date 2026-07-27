import { db } from '../db'
import { SubmissionRepository } from '../db/repositories/submission.repository'
import { TournamentRepository } from '../db/repositories/tournament.repository'
import { requireOwner, requireSubscriber, tournamentsAuthPreHandler } from './proxy'

export const tournamentRepository = new TournamentRepository(db)
export const submissionRepository = new SubmissionRepository(db)

export { requireOwner, requireSubscriber, tournamentsAuthPreHandler }
