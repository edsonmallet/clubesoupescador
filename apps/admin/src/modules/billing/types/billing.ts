export type TenantBillingStatus =
  | 'inactive'
  | 'active'
  | 'overdue'
  | 'cancelled'

export type TenantBilling = {
  id: string
  tenantId: string
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: TenantBillingStatus
  createdAt: string
  updatedAt: string
}

export type SaasPlan = {
  id: string
  name: string
  priceCents: number
  active: boolean
  createdAt: string
}

export type CheckoutInput = {
  planId: string
  name: string
  cpfCnpj: string
}

export type CheckoutResult = {
  id: string
  status: string
  paymentUrl: string | null
}
