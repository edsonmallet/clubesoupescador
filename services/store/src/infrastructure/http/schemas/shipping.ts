import { Type } from '@sinclair/typebox'

export const ShippingOptionSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  price: Type.Number(),
  deliveryTimeDays: Type.Number(),
})

export const QuoteShippingResponseSchema = Type.Array(ShippingOptionSchema)

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
