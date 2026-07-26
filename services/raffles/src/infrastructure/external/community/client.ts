import { env } from '../../../shared/env'

export class CommunityClient {
  constructor(
    private readonly baseUrl: string = env.COMMUNITY_SERVICE_URL,
    private readonly internalToken: string = env.INTERNAL_SERVICE_TOKEN,
  ) {}

  async createSystemTopic(data: {
    tenantId: string
    categorySlug: string
    title: string
    body: string
  }): Promise<void> {
    await fetch(`${this.baseUrl}/internal/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': this.internalToken,
      },
      body: JSON.stringify({ ...data, authorUid: 'system' }),
    })
  }
}
