import { setRole } from '@clube/firebase-utils'
import type { ISubscriptionRepository } from '../../domain/interfaces/ISubscriptionRepository'
import type { GrantXpUseCase } from '../xp/grant-xp.usecase'

/**
 * Asaas delivers two payload shapes (https://docs.asaas.com/docs/payment-events
 * and https://docs.asaas.com/docs/subscription-events):
 *  - payment events:      { id, event, payment: { id, subscription? } }
 *  - subscription events: { id, event, subscription: { object, id, ... } }
 * The outer `id` (e.g. "evt_...") is the idempotency key Asaas recommends.
 */
export type AsaasWebhookEvent = {
  id?: string
  event:
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_OVERDUE'
    | 'SUBSCRIPTION_DELETED'
    | 'SUBSCRIPTION_CANCELLED'
    | string
  payment?: {
    id?: string
    subscription?: string
  }
  subscription?: { id?: string } | string
}

const SUBSCRIPTION_PAYMENT_XP = 50

/**
 * `SUBSCRIPTION_DELETED` is the documented Asaas event name; the legacy
 * `SUBSCRIPTION_CANCELLED` is matched too since matching both is safer than
 * silently ignoring a real cancellation.
 */
const CANCELLATION_EVENTS = new Set([
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_INACTIVATED',
  'SUBSCRIPTION_CANCELLED',
])

export function extractAsaasSubscriptionId(
  event: AsaasWebhookEvent,
): string | null {
  if (event.payment?.subscription) return event.payment.subscription
  if (typeof event.subscription === 'string') return event.subscription
  return event.subscription?.id ?? null
}

export class ProcessWebhookUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly grantXpUseCase: GrantXpUseCase,
  ) {}

  async execute(event: AsaasWebhookEvent): Promise<void> {
    const asaasSubscriptionId = extractAsaasSubscriptionId(event)
    // Events unrelated to a subscription (or with an unexpected shape) are a
    // no-op — throwing here would only make the BullMQ job retry forever.
    if (!asaasSubscriptionId) return

    const subscription =
      await this.subscriptionRepository.findByAsaasSubscriptionId(
        asaasSubscriptionId,
      )
    if (!subscription) return

    if (CANCELLATION_EVENTS.has(event.event)) {
      await this.subscriptionRepository.updateStatus(
        subscription.id,
        'cancelled',
      )
      // Keep tenant_id: revokeRole() would null it, locking the member out of
      // viewing their lapsed subscription and out of re-subscribing.
      await setRole(subscription.uid, 'user', subscription.tenantId)
      return
    }

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
        await setRole(subscription.uid, 'user', subscription.tenantId)
        return
      }
      default:
        return
    }
  }
}
