import { Type } from '@sinclair/typebox'

export const VoteBodySchema = Type.Object({
  value: Type.Union([Type.Literal(1), Type.Literal(-1)]),
})

export const VoteResponseSchema = Type.Object({
  scoreDelta: Type.Number(),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
