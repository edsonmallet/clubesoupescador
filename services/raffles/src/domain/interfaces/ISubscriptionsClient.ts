export type SubscriberInfo = {
  status: string
  planId: string | null
}

export interface ISubscriptionsClient {
  getSubscriber(
    uid: string,
    tenantId: string,
    authToken: string,
  ): Promise<SubscriberInfo | null>
  getPlanPriceCents(tenantId: string, planId: string): Promise<number | null>
}
