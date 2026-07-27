import type { ITenantBillingRepository } from '../../domain/interfaces/ITenantBillingRepository'
import type { updateTenantBilling } from '../../infrastructure/external/bff/client'

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
    | 'SUBSCRIPTION_INACTIVATED'
    | 'SUBSCRIPTION_CANCELLED'
    | string
  payment?: {
    id?: string
    subscription?: string
  }
  subscription?: { id?: string } | string
}

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

export type BffClient = {
  updateTenantBilling: typeof updateTenantBilling
}

export class ProcessWebhookUseCase {
  constructor(
    private readonly tenantBillingRepository: ITenantBillingRepository,
    private readonly bffClient: BffClient,
  ) {}

  async execute(event: AsaasWebhookEvent): Promise<void> {
    const asaasSubscriptionId = extractAsaasSubscriptionId(event)
    // Events unrelated to a subscription (or with an unexpected shape) are a
    // no-op — throwing here would only make the BullMQ job retry forever.
    if (!asaasSubscriptionId) return

    const tenantBilling =
      await this.tenantBillingRepository.findByAsaasSubscriptionId(
        asaasSubscriptionId,
      )
    // No matching row: no-op instead of throwing, so a retry does not loop
    // forever on an event we can never resolve.
    if (!tenantBilling) return

    if (CANCELLATION_EVENTS.has(event.event)) {
      await this.tenantBillingRepository.updateStatus(
        tenantBilling.id,
        'cancelled',
      )
      await this.bffClient.updateTenantBilling(tenantBilling.tenantId, {
        status: 'suspended',
      })
      return
    }

    switch (event.event) {
      case 'PAYMENT_CONFIRMED': {
        await this.tenantBillingRepository.updateStatus(
          tenantBilling.id,
          'active',
        )
        await this.bffClient.updateTenantBilling(tenantBilling.tenantId, {
          status: 'active',
          planId: tenantBilling.planId,
        })
        return
      }
      case 'PAYMENT_OVERDUE': {
        // Suspending automatically on overdue is out of scope (see Global
        // Constraints) — the BFF is not notified here on purpose.
        await this.tenantBillingRepository.updateStatus(
          tenantBilling.id,
          'overdue',
        )
        return
      }
      default:
        return
    }
  }
}
