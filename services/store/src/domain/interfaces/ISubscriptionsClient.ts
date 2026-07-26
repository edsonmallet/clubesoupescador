export type SubscriberInfo = {
  status: string
  levelId: string | null
}

export type LevelDiscount = {
  storeDiscountPct: number
  cashbackPct: number
}

export interface ISubscriptionsClient {
  getSubscriber(
    uid: string,
    tenantId: string,
    authToken: string,
  ): Promise<SubscriberInfo | null>
  getLevelDiscount(levelId: string): Promise<LevelDiscount | null>
}
