import { Type } from '@sinclair/typebox'

export const RaffleSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.String(),
  prize: Type.String(),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
  ticketPriceCents: Type.Number(),
  maxTickets: Type.Union([Type.Number(), Type.Null()]),
  drawDate: Type.Union([Type.String(), Type.Null()]),
  lotteryGame: Type.String(),
  status: Type.String(),
  contestNumber: Type.Union([Type.Number(), Type.Null()]),
  winnerTicket: Type.Union([Type.Number(), Type.Null()]),
  winnerUid: Type.Union([Type.String(), Type.Null()]),
  drawnAt: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
})

export const ListRafflesResponseSchema = Type.Object({
  items: Type.Array(RaffleSchema),
  total: Type.Number(),
})

export const RaffleResultResponseSchema = Type.Object({
  status: Type.String(),
  contestNumber: Type.Union([Type.Number(), Type.Null()]),
  winnerTicket: Type.Union([Type.Number(), Type.Null()]),
  winnerUid: Type.Union([Type.String(), Type.Null()]),
  drawnAt: Type.Union([Type.String(), Type.Null()]),
})

export const CreateRaffleBodySchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  description: Type.String(),
  prize: Type.String({ minLength: 1 }),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
  ticketPriceCents: Type.Number({ minimum: 1 }),
  maxTickets: Type.Union([Type.Number({ minimum: 1 }), Type.Null()]),
  drawDate: Type.Union([Type.String(), Type.Null()]),
  lotteryGame: Type.Optional(Type.String({ minLength: 1 })),
})

export const UpdateRaffleBodySchema = Type.Partial(
  Type.Object({
    title: Type.String(),
    description: Type.String(),
    prize: Type.String(),
    imageUrl: Type.Union([Type.String(), Type.Null()]),
    ticketPriceCents: Type.Number({ minimum: 1 }),
    maxTickets: Type.Union([Type.Number({ minimum: 1 }), Type.Null()]),
    drawDate: Type.Union([Type.String(), Type.Null()]),
    lotteryGame: Type.String(),
    status: Type.String(),
  }),
)

export const DrawRaffleBodySchema = Type.Object({
  contestNumber: Type.Number({ minimum: 1 }),
})

export const DrawRaffleResponseSchema = Type.Object({
  contestNumber: Type.Number(),
  winnerTicket: Type.Number(),
  winnerUid: Type.String(),
})

export const DrawQueuedResponseSchema = Type.Object({ queued: Type.Boolean() })

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
