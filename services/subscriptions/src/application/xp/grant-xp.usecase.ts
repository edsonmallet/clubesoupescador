import type { Subscription } from '../../domain/entities/subscription'
import { SubscriptionNotFoundError } from '../../domain/errors'
import type { ILevelRepository } from '../../domain/interfaces/ILevelRepository'
import type { ISubscriptionRepository } from '../../domain/interfaces/ISubscriptionRepository'

export type GrantXpInput = {
  subscriptionId: string
  tenantId: string
  amount: number
  source: string
}

export type InsertXpEvent = (event: {
  tenantId: string
  subscriberId: string
  amount: number
  source: string
}) => Promise<void>

export class GrantXpUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly levelRepository: ILevelRepository,
    private readonly insertXpEvent: InsertXpEvent,
  ) {}

  async execute(input: GrantXpInput): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findById(
      input.subscriptionId,
    )
    if (!subscription) {
      throw new SubscriptionNotFoundError(input.subscriptionId)
    }

    const totalXp = subscription.totalXp + input.amount
    const level = await this.levelRepository.findHighestForXp(totalXp)

    const updated = await this.subscriptionRepository.updateXp(
      subscription.id,
      totalXp,
      level?.id ?? subscription.levelId,
    )

    await this.insertXpEvent({
      tenantId: input.tenantId,
      subscriberId: subscription.id,
      amount: input.amount,
      source: input.source,
    })

    return updated
  }
}
