export type TenantBillingStatus =
  | 'inactive'
  | 'active'
  | 'overdue'
  | 'cancelled'

export type BillingOverviewItem = {
  tenantId: string
  planName: string
  priceCents: number
  status: TenantBillingStatus
}

export type BillingOverview = {
  items: BillingOverviewItem[]
  mrrCents: number
  overdueCount: number
}
