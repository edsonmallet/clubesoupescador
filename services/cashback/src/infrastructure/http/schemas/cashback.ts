import { Type } from '@sinclair/typebox'

export const BalanceResponseSchema = Type.Object({
  availableCents: Type.Number(),
  expiringSoonCents: Type.Number(),
  nextExpiryAt: Type.Union([Type.String(), Type.Null()]),
})

export const HistoryEntrySchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  amountCents: Type.Number(),
  source: Type.String(),
  sourceId: Type.Union([Type.String(), Type.Null()]),
  expiresAt: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
})

export const HistoryResponseSchema = Type.Object({
  items: Type.Array(HistoryEntrySchema),
  total: Type.Number(),
})

export const GrantBodySchema = Type.Object({
  tenantId: Type.String(),
  uid: Type.String(),
  source: Type.String(),
  sourceId: Type.Union([Type.String(), Type.Null()]),
  paidAmountCents: Type.Number({ minimum: 0 }),
})

export const GrantResponseSchema = Type.Object({ granted: Type.Boolean() })

export const ConfigItemSchema = Type.Object({
  source: Type.String(),
  pct: Type.Number(),
  expiryMonths: Type.Number(),
})

export const ConfigListResponseSchema = Type.Array(ConfigItemSchema)

export const UpdateConfigBodySchema = Type.Object({
  source: Type.String({ minLength: 1 }),
  pct: Type.Number({ minimum: 0, maximum: 100 }),
  expiryMonths: Type.Number({ minimum: 1 }),
})

export const CashbackSummaryResponseSchema = Type.Object({
  totalGrantedCents: Type.Number(),
  totalRedeemedCents: Type.Number(),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
