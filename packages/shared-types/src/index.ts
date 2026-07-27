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

export type RaffleStatus = 'open' | 'closed' | 'drawn'

export type Raffle = {
  id: string
  title: string
  description: string
  prize: string
  imageUrl: string | null
  ticketPriceCents: number
  maxTickets: number | null
  drawDate: string | null
  lotteryGame: string
  status: RaffleStatus
  contestNumber: number | null
  winnerTicket: number | null
  winnerUid: string | null
  drawnAt: string | null
  createdAt: string
}

export type CreateRaffleInput = {
  title: string
  description: string
  prize: string
  imageUrl: string | null
  ticketPriceCents: number
  maxTickets: number | null
  drawDate: string | null
  lotteryGame?: string
}

export type UpdateRaffleInput = Partial<CreateRaffleInput> & {
  status?: RaffleStatus
}

export type RaffleResult = {
  status: RaffleStatus
  contestNumber: number | null
  winnerTicket: number | null
  winnerUid: string | null
  drawnAt: string | null
}

export type Ticket = {
  id: string
  number: number
  status: 'pending' | 'confirmed'
  source: 'subscription_conversion' | 'purchase'
  createdAt: string
}

export type JoinRaffleResponse = {
  tickets: Ticket[]
  count: number
}

export type BuyTicketsResponse = {
  tickets: Ticket[]
  paymentUrl: string | null
}

export type Category = {
  id: string
  slug: string
  name: string
  description: string
}

export type Topic = {
  id: string
  categoryId: string
  authorUid: string
  title: string
  body: string
  pinned: boolean
  locked: boolean
  voteScore: number
  commentCount: number
  createdAt: string
}

export type TopicSort = 'hot' | 'new' | 'top' | 'rising'

export type CommunityComment = {
  id: string
  topicId: string
  authorUid: string
  parentId: string | null
  depth: number
  body: string
  voteScore: number
  deleted: boolean
  createdAt: string
}

export type ReactionCounts = Record<string, number>

export type TopicDetail = {
  topic: Topic
  comments: CommunityComment[]
  reactionCounts: ReactionCounts
  myReactions: string[]
}

export type CreateTopicInput = {
  categoryId: string
  title: string
  body: string
}

export type CreateCommentInput = {
  parentId: string | null
  body: string
}

export type ToggleVoteResponse = {
  scoreDelta: number
}

export type ToggleReactionResponse = {
  added: boolean
}

export type Member = {
  id: string
  uid: string
  planId: string
  status: string
  totalXp: number
  levelId: string | null
  createdAt: string
}

export type Level = {
  id: string
  name: string
  minXp: number
  storeDiscountPct: number
  cashbackPct: number
}

export type UpdateLevelInput = Partial<{
  name: string
  minXp: number
  storeDiscountPct: number
  cashbackPct: number
}>

export type XpConfigItem = {
  source: string
  points: number
  dailyCap: number | null
}

export type CashbackConfigItem = {
  source: string
  pct: number
  expiryMonths: number
}

export type SubscriptionsSummary = {
  activeMembers: number
  monthlyRevenueCents: number
  signupsByDay: Array<{ date: string; count: number }>
}

export type StoreSummary = {
  revenueCentsThisMonth: number
  pendingOrders: number
}

export type CashbackSummary = {
  totalGrantedCents: number
  totalRedeemedCents: number
}

export type TournamentStatus = 'open' | 'closed'

export type Tournament = {
  id: string
  title: string
  description: string
  status: TournamentStatus
  createdAt: string
}

export type CreateTournamentInput = {
  title: string
  description: string
}

export type Submission = {
  id: string
  tournamentId: string
  authorUid: string
  mediaUrl: string
  voteScore: number
  manualScore: number | null
  createdAt: string
}

export type LandingTemplateId = 'clube-simples' | 'clube-premium'

export type LandingTheme = {
  primary?: string
  secondary?: string
  font?: string
}

export type LandingHeroSection = {
  title?: string
  subtitle?: string
  bgImage?: string
  ctaText?: string
}

export type LandingBenefitItem = {
  icon: string
  title: string
  text: string
}

export type LandingBenefitsSection = {
  items?: LandingBenefitItem[]
}

export type LandingPlanSection = {
  price?: number
  benefits?: string[]
}

export type LandingSeo = {
  title?: string
  description?: string
  ogImage?: string
}

export type LandingSections = {
  hero?: LandingHeroSection
  benefits?: LandingBenefitsSection
  plan?: LandingPlanSection
}

export type LandingConfig = {
  templateId: LandingTemplateId
  theme: LandingTheme
  sections: LandingSections
  seo: LandingSeo
  published: boolean
  publishedAt: string | null
  updatedAt: string | null
}

export type UpdateLandingConfigInput = Partial<LandingConfig>

export type DomainType = 'subdomain' | 'custom'

export type Domain = {
  id: string
  domain: string
  type: DomainType
  verified: boolean
  verifiedAt: string | null
  lastError: string | null
  createdAt: string
}
