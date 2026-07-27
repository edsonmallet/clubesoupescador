import { Type } from '@sinclair/typebox'

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})

export const SaasPlanSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  priceCents: Type.Number(),
  active: Type.Boolean(),
  createdAt: Type.String(),
})

export const ListPlansResponseSchema = Type.Array(SaasPlanSchema)

export const CreatePlanBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  priceCents: Type.Number({ minimum: 0 }),
  active: Type.Optional(Type.Boolean()),
})

export const UpdatePlanBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  priceCents: Type.Optional(Type.Number({ minimum: 0 })),
  active: Type.Optional(Type.Boolean()),
})
