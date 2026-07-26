import type {
  ISubscriptionsClient,
  SubscriberInfo,
} from '../../../domain/interfaces/ISubscriptionsClient'
import { env } from '../../../shared/env'

export class SubscriptionsClient implements ISubscriptionsClient {
  constructor(
    private readonly baseUrl: string = env.SUBSCRIPTIONS_SERVICE_URL,
  ) {}

  async getSubscriber(
    uid: string,
    tenantId: string,
    authToken: string,
  ): Promise<SubscriberInfo | null> {
    const response = await fetch(`${this.baseUrl}/subscriptions/me`, {
      headers: {
        authorization: `Bearer ${authToken}`,
        'x-tenant-id': tenantId,
      },
    })
    if (!response.ok) return null

    const body = (await response.json()) as {
      status: string
      planId: string
    } | null
    if (!body) return null

    return { status: body.status, planId: body.planId }
  }

  async getPlanPriceCents(
    tenantId: string,
    planId: string,
  ): Promise<number | null> {
    const response = await fetch(`${this.baseUrl}/plans`, {
      headers: { 'x-tenant-id': tenantId },
    })
    if (!response.ok) return null

    const plans = (await response.json()) as Array<{
      id: string
      priceCents: number
    }>

    return plans.find((plan) => plan.id === planId)?.priceCents ?? null
  }
}
