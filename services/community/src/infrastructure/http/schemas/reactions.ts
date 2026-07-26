import { Type } from '@sinclair/typebox'

export const ReactBodySchema = Type.Object({
  emoji: Type.Union([
    Type.Literal('👍'),
    Type.Literal('🔥'),
    Type.Literal('😂'),
    Type.Literal('😮'),
    Type.Literal('🤔'),
  ]),
})

export const ReactResponseSchema = Type.Object({
  added: Type.Boolean(),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
