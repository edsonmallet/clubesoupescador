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

export type RegisterUserResponse = {
  id: string
  tenantId: string
  uid: string
  role: Role
  createdAt: string
}

export type MeResponse = {
  uid: string
  role: Role
  tenantId: string
  registeredAt: string | null
}

export type Plan = {
  id: string
  name: string
  priceCents: number
}

export type MySubscription = {
  id: string
  planId: string
  status: string
  totalXp: number
  levelId: string | null
} | null

export type CreateCheckoutInput = {
  planId: string
  name: string
  cpfCnpj: string
}

export type CreateCheckoutResponse = {
  paymentUrl: string | null
}

export type Offer = {
  id: string
  name: string
  description: string
  priceFullCents: number
  priceClubCents: number
  stock: number
  images: string[]
}

export type AdminOffer = Offer & {
  sku: string
  active: boolean
}

export type CreateOfferInput = {
  name: string
  description: string
  priceFullCents: number
  priceClubCents: number
  stock: number
  sku: string
  images: string[]
  active?: boolean
}

export type UpdateOfferInput = Partial<CreateOfferInput>

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type OrderAddress = {
  zipCode: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
}

export type OrderItem = {
  id: string
  productId: string
  qty: number
  unitPriceCents: number
  discountPct: number
}

export type Order = {
  id: string
  status: OrderStatus
  items: OrderItem[]
  subtotalCents: number
  levelDiscountAmtCents: number
  cashbackUsedAmtCents: number
  shippingAmtCents: number
  totalCents: number
  trackingCode: string | null
  shippingLabelUrl: string | null
  address: OrderAddress
  createdAt: string
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
}

export type BuyOfferInput = {
  qty: number
  cashbackUseCents: number
  address: OrderAddress
}

export type BuyOfferResponse = {
  orderId: string
  totalCents: number
  paymentUrl: string | null
  cashbackAppliedCents: number
}

export type ShippingOption = {
  id: number
  name: string
  price: number
  deliveryTimeDays: number
}

export type CashbackBalance = {
  availableCents: number
  expiringSoonCents: number
  nextExpiryAt: string | null
}

export type CashbackEntryType =
  | 'earned_purchase'
  | 'redeemed'
  | 'expired_to_xp'
  | 'manual_adjustment'

export type CashbackEntry = {
  id: string
  type: CashbackEntryType
  amountCents: number
  source: string
  sourceId: string | null
  expiresAt: string | null
  createdAt: string
}
