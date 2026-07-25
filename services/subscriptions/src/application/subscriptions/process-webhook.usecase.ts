import { revokeRole, setRole } from '@clube/firebase-utils'
import type { ISubscriptionRepository } from '../../domain/interfaces/ISubscriptionRepository'
import type { GrantXpUseCase } from '../xp/grant-xp.usecase'

export type AsaasWebhookEvent = {
  event:
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_OVERDUE'
    | 'SUBSCRIPTION_CANCELLED'
    | string
  payment: {
    subscription: string
  }
}

const SUBSCRIPTION_PAYMENT_XP = 50

export class ProcessWebhookUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly grantXpUseCase: GrantXpUseCase,
  ) {}

  async execute(event: AsaasWebhookEvent): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findByAsaasSubscriptionId(
        event.payment.subscription,
      )
    if (!subscription) return

    switch (event.event) {
      case 'PAYMENT_CONFIRMED': {
        await this.subscriptionRepository.updateStatus(
          subscription.id,
          'active',
        )
        await setRole(subscription.uid, 'subscriber', subscription.tenantId)
        await this.grantXpUseCase.execute({
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          amount: SUBSCRIPTION_PAYMENT_XP,
          source: 'subscription_payment',
        })
        return
      }
      case 'PAYMENT_OVERDUE': {
        await this.subscriptionRepository.updateStatus(
          subscription.id,
          'overdue',
        )
        await revokeRole(subscription.uid)
        return
      }
      case 'SUBSCRIPTION_CANCELLED': {
        await this.subscriptionRepository.updateStatus(
          subscription.id,
          'cancelled',
        )
        await revokeRole(subscription.uid)
        return
      }
      default:
        return
    }
  }
}
