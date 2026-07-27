import { Type } from '@sinclair/typebox'

export const TournamentSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.String(),
  status: Type.String(),
  createdAt: Type.String(),
})

export const ListTournamentsResponseSchema = Type.Object({
  items: Type.Array(TournamentSchema),
  total: Type.Number(),
})

export const CreateTournamentBodySchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  description: Type.String(),
})

export const SubmissionSchema = Type.Object({
  id: Type.String(),
  tournamentId: Type.String(),
  authorUid: Type.String(),
  mediaUrl: Type.String(),
  voteScore: Type.Number(),
  manualScore: Type.Union([Type.Number(), Type.Null()]),
  createdAt: Type.String(),
})

export const ListSubmissionsResponseSchema = Type.Array(SubmissionSchema)

export const CreateSubmissionBodySchema = Type.Object({
  mediaUrl: Type.String({ minLength: 1 }),
})

export const SetScoreBodySchema = Type.Object({
  manualScore: Type.Number({ minimum: 0 }),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
