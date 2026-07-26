import { Type } from '@sinclair/typebox'

export const TicketSchema = Type.Object({
  id: Type.String(),
  number: Type.Number(),
  status: Type.String(),
  source: Type.String(),
  createdAt: Type.String(),
})

export const JoinRaffleResponseSchema = Type.Object({
  tickets: Type.Array(TicketSchema),
  count: Type.Number(),
})

export const BuyTicketsBodySchema = Type.Object({
  qty: Type.Number({ minimum: 1 }),
})

export const BuyTicketsResponseSchema = Type.Object({
  tickets: Type.Array(TicketSchema),
  paymentUrl: Type.Union([Type.String(), Type.Null()]),
})

export const MyTicketsResponseSchema = Type.Array(TicketSchema)

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
