import { Type } from '@sinclair/typebox'

export const LevelResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  minXp: Type.Number(),
  storeDiscountPct: Type.Number(),
  cashbackPct: Type.Number(),
})
