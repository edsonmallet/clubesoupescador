export type Role =
  | 'super_admin'
  | 'store_owner'
  | 'store_manager'
  | 'community_mod'
  | 'subscriber'
  | 'user'

export type CustomClaims = {
  role: Role
  tenant_id: string | null
}

export type Tenant = {
  id: string
  slug: string
  name: string
  customDomain: string | null
  createdAt: string
}
