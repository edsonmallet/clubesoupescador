import type { IOrderRepository } from '../../domain/interfaces/IOrderRepository'

/**
 * Asaas payment event payload (https://docs.asaas.com/docs/payment-events).
 * The outer `id` (e.g. "evt_...") is the idempotency key Asaas recommends.
 */
export type AsaasPaymentWebhookEvent = {
  id?: string
  event: 'PAYMENT_CONFIRMED' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | string
  payment?: { id?: string }
}

const XP_PER_REAL_PAID = 1

const CONFIRMATION_EVENTS = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'])

export type EnqueueGrantXp = (data: {
  tenantId: string
  uid: string
  amount: number
  source: string
}) => Promise<void>

export type EnqueueGrantCashback = (data: {
  tenantId: string
  uid: string
  paidAmountCents: number
  orderId: string
  source: string
}) => Promise<void>

export class ProcessPaymentWebhookUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly enqueueGrantXp: EnqueueGrantXp,
    private readonly enqueueGrantCashback: EnqueueGrantCashback,
  ) {}

  async execute(event: AsaasPaymentWebhookEvent): Promise<void> {
    if (!CONFIRMATION_EVENTS.has(event.event)) return

    const paymentId = event.payment?.id
    if (!paymentId) return

    const order = await this.orderRepository.findByAsaasPaymentId(paymentId)
    // Unknown or already-processed payment — a no-op keeps webhook retries
    // idempotent instead of throwing (which would only trigger more retries).
    if (!order || order.status !== 'pending') return

    await this.orderRepository.updateStatus(order.id, 'paid')

    await this.enqueueGrantXp({
      tenantId: order.tenantId,
      uid: order.uid,
      amount: Math.round(order.totalCents / 100) * XP_PER_REAL_PAID,
      source: 'store_purchase',
    })

    // The cashback % is owned by services/cashback (per-source config,
    // admin-configurable) — store just reports what was paid and lets it
    // decide the amount, instead of duplicating that calculation here.
    await this.enqueueGrantCashback({
      tenantId: order.tenantId,
      uid: order.uid,
      paidAmountCents: order.totalCents,
      orderId: order.id,
      source: 'earned_purchase',
    })
  }
}
