import { Type } from '@sinclair/typebox'

export const InternalCreateTopicBodySchema = Type.Object({
  tenantId: Type.String(),
  categorySlug: Type.String(),
  authorUid: Type.String(),
  title: Type.String({ minLength: 1 }),
  body: Type.String({ minLength: 1 }),
})

export const InternalCreateTopicResponseSchema = Type.Object({
  id: Type.String(),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
