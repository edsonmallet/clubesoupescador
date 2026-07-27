export type SuperTenant = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  planId: string | null
  status: 'active' | 'suspended' | 'canceled'
  ownerUid: string
  createdAt: string
}

export type TenantWithMemberCount = {
  tenant: SuperTenant
  memberCount: number
}
