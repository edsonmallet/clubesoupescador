import { Type } from '@sinclair/typebox'

export const CreateCheckoutBodySchema = Type.Object({
  planId: Type.String(),
  name: Type.String({ minLength: 1 }),
  cpfCnpj: Type.String({ minLength: 11 }),
})

export const CreateCheckoutResponseSchema = Type.Object({
  paymentUrl: Type.Union([Type.String(), Type.Null()]),
})

export const MySubscriptionResponseSchema = Type.Union([
  Type.Object({
    id: Type.String(),
    planId: Type.String(),
    status: Type.String(),
    totalXp: Type.Number(),
    levelId: Type.Union([Type.String(), Type.Null()]),
  }),
  Type.Null(),
])
