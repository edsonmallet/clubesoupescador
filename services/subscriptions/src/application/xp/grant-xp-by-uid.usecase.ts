import type { Subscription } from '../../domain/entities/subscription'
import type { ISubscriptionRepository } from '../../domain/interfaces/ISubscriptionRepository'
import type { GrantXpUseCase } from './grant-xp.usecase'

export type GrantXpByUidInput = {
  tenantId: string
  uid: string
  amount: number
  source: string
}

/**
 * Cross-service queue jobs (store's `grant-xp` after a purchase, cashback's
 * after an expiry) only know the member's Firebase uid — GrantXpUseCase
 * itself works on the internal subscription id, so this resolves uid ->
 * subscription first. A uid with no active subscriber row (e.g. already
 * churned) is a no-op rather than an error, since a queued job can arrive
 * well after the subscription lapsed.
 */
export class GrantXpByUidUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly grantXpUseCase: GrantXpUseCase,
  ) {}

  async execute(input: GrantXpByUidInput): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepository.findByUid(
      input.uid,
      input.tenantId,
    )
    if (!subscription) return null

    return this.grantXpUseCase.execute({
      subscriptionId: subscription.id,
      tenantId: input.tenantId,
      amount: input.amount,
      source: input.source,
    })
  }
}
