import { Type } from '@sinclair/typebox'

export const SubscriberSchema = Type.Object({
  id: Type.String(),
  uid: Type.String(),
  planId: Type.String(),
  status: Type.String(),
  totalXp: Type.Number(),
  levelId: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
})

export const ListSubscribersResponseSchema = Type.Object({
  items: Type.Array(SubscriberSchema),
  total: Type.Number(),
})

export const PromoteBodySchema = Type.Object({
  role: Type.Literal('community_mod'),
})

export const PromoteResponseSchema = Type.Object({ promoted: Type.Boolean() })

export const LevelSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  minXp: Type.Number(),
  storeDiscountPct: Type.Number(),
  cashbackPct: Type.Number(),
})

export const ListLevelsResponseSchema = Type.Array(LevelSchema)

export const UpdateLevelBodySchema = Type.Partial(
  Type.Object({
    name: Type.String(),
    minXp: Type.Number({ minimum: 0 }),
    storeDiscountPct: Type.Number({ minimum: 0, maximum: 100 }),
    cashbackPct: Type.Number({ minimum: 0, maximum: 100 }),
  }),
)

export const XpConfigItemSchema = Type.Object({
  source: Type.String(),
  points: Type.Number(),
  dailyCap: Type.Union([Type.Number(), Type.Null()]),
})

export const ListXpConfigResponseSchema = Type.Array(XpConfigItemSchema)

export const UpdateXpConfigBodySchema = Type.Object({
  source: Type.String({ minLength: 1 }),
  points: Type.Number({ minimum: 0 }),
  dailyCap: Type.Union([Type.Number({ minimum: 1 }), Type.Null()]),
})

export const SummaryResponseSchema = Type.Object({
  activeMembers: Type.Number(),
  monthlyRevenueCents: Type.Number(),
  signupsByDay: Type.Array(Type.Object({ date: Type.String(), count: Type.Number() })),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
