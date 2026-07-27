import { Type } from '@sinclair/typebox'

// The usecase (services/billing/src/application/billing/create-checkout.usecase.ts)
// requires `name` and `cpfCnpj` in addition to `planId` — Asaas needs a real
// name/document to create a customer, and unlike services/subscriptions (where
// the member's own data is on hand), billing has no domain knowledge of the
// store owner. The usecase's own doc comment says the caller must supply it,
// so the body schema includes both fields even though the brief only lists
// `{planId}`.
export const CheckoutBodySchema = Type.Object({
  planId: Type.String(),
  name: Type.String({ minLength: 1 }),
  cpfCnpj: Type.String({ minLength: 11 }),
})

export const CheckoutResponseSchema = Type.Object({
  id: Type.String(),
  status: Type.String(),
  paymentUrl: Type.Union([Type.String(), Type.Null()]),
})

export const TenantBillingSchema = Type.Object({
  id: Type.String(),
  tenantId: Type.String(),
  planId: Type.String(),
  asaasCustomerId: Type.Union([Type.String(), Type.Null()]),
  asaasSubscriptionId: Type.Union([Type.String(), Type.Null()]),
  status: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export const BillingOverviewItemSchema = Type.Object({
  tenantId: Type.String(),
  planName: Type.String(),
  priceCents: Type.Number(),
  status: Type.String(),
})

export const BillingOverviewResponseSchema = Type.Object({
  items: Type.Array(BillingOverviewItemSchema),
  mrrCents: Type.Number(),
  overdueCount: Type.Number(),
})
