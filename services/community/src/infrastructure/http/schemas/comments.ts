import { Type } from '@sinclair/typebox'
import { CommentSchema } from './topics'

export { CommentSchema }

export const CreateCommentBodySchema = Type.Object({
  parentId: Type.Union([Type.String(), Type.Null()]),
  body: Type.String({ minLength: 1 }),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
