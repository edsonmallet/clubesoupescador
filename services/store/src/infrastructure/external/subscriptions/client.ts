import type {
  ISubscriptionsClient,
  LevelDiscount,
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
      levelId: string | null
    } | null
    if (!body) return null

    return { status: body.status, levelId: body.levelId }
  }

  async getLevelDiscount(levelId: string): Promise<LevelDiscount | null> {
    const response = await fetch(`${this.baseUrl}/levels/${levelId}`)
    if (!response.ok) return null

    const body = (await response.json()) as {
      storeDiscountPct: string | number
      cashbackPct: string | number
    }

    return {
      storeDiscountPct: Number(body.storeDiscountPct),
      cashbackPct: Number(body.cashbackPct),
    }
  }
}
