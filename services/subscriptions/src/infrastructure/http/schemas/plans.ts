import { Type } from '@sinclair/typebox'

export const PlanSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  priceCents: Type.Number(),
})

export const ListPlansResponseSchema = Type.Array(PlanSchema)
