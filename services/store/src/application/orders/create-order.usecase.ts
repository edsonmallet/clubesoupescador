import type { AsaasClient } from '@clube/asaas-sdk'
import type { OrderAddress } from '../../domain/entities/Order'
import { ProductNotFoundError } from '../../domain/errors'
import type {
  CreateOrderDto,
  IOrderRepository,
} from '../../domain/interfaces/IOrderRepository'
import type { IProductRepository } from '../../domain/interfaces/IProductRepository'
import type { ISubscriptionsClient } from '../../domain/interfaces/ISubscriptionsClient'

const CASHBACK_MAX_PCT_OF_TOTAL = 0.3

export type CreateOrderItemInput = {
  productId: string
  qty: number
}

export type CreateOrderInput = {
  uid: string
  tenantId: string
  authToken: string
  items: CreateOrderItemInput[]
  cashbackUseCents: number
  address: OrderAddress
}

export type CreateOrderOutput = {
  orderId: string
  totalCents: number
  paymentUrl: string | null
  cashbackAppliedCents: number
}

export type EnqueueCashbackDebit = (data: {
  tenantId: string
  uid: string
  amountCents: number
  orderId: string
}) => Promise<void>

export class CreateOrderUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly subscriptionsClient: ISubscriptionsClient,
    private readonly asaasClient: AsaasClient,
    private readonly enqueueCashbackDebit: EnqueueCashbackDebit,
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const products = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.productRepository.findById(
          input.tenantId,
          item.productId,
        )
        if (!product || !product.active) {
          throw new ProductNotFoundError(item.productId)
        }
        return { item, product }
      }),
    )

    // Route-level `requireSubscriber` already guarantees an active
    // subscription; the club price applies unconditionally here.
    const subtotalCents = products.reduce(
      (sum, { item, product }) => sum + product.priceClubCents * item.qty,
      0,
    )

    const subscriber = await this.subscriptionsClient.getSubscriber(
      input.uid,
      input.tenantId,
      input.authToken,
    )
    const level = subscriber?.levelId
      ? await this.subscriptionsClient.getLevelDiscount(subscriber.levelId)
      : null

    const levelDiscountAmtCents = level
      ? Math.round((subtotalCents * level.storeDiscountPct) / 100)
      : 0
    const afterDiscountCents = subtotalCents - levelDiscountAmtCents

    const cashbackLimitCents = Math.round(
      afterDiscountCents * CASHBACK_MAX_PCT_OF_TOTAL,
    )
    const cashbackUsedAmtCents = Math.max(
      0,
      Math.min(input.cashbackUseCents, cashbackLimitCents),
    )

    const totalCents = afterDiscountCents - cashbackUsedAmtCents

    const orderData: CreateOrderDto = {
      tenantId: input.tenantId,
      uid: input.uid,
      status: 'pending',
      levelId: subscriber?.levelId ?? null,
      items: products.map(({ item, product }) => ({
        productId: product.id,
        qty: item.qty,
        unitPriceCents: product.priceClubCents,
        discountPct: level?.storeDiscountPct ?? 0,
      })),
      subtotalCents,
      levelDiscountAmtCents,
      cashbackUsedAmtCents,
      shippingAmtCents: 0,
      totalCents,
      asaasPaymentId: null,
      address: input.address,
    }

    // Stock is decremented atomically inside the transaction — if any item
    // sold out concurrently, the whole order (and every other item's
    // decrement) rolls back rather than leaving a partially-fulfilled order.
    const order = await this.orderRepository.create(orderData)

    const paymentUrl = await this.charge(input.uid, totalCents, order.id)

    if (cashbackUsedAmtCents > 0) {
      await this.enqueueCashbackDebit({
        tenantId: input.tenantId,
        uid: input.uid,
        amountCents: cashbackUsedAmtCents,
        orderId: order.id,
      })
    }

    return {
      orderId: order.id,
      totalCents,
      paymentUrl,
      cashbackAppliedCents: cashbackUsedAmtCents,
    }
  }

  /**
   * The member's Asaas customer already exists from their subscription
   * checkout (created there with externalReference = uid) — reused here
   * instead of asking for name/cpfCnpj again. If it's missing, the order
   * still exists locally; the caller can retry payment once fixed rather
   * than lose the stock already committed.
   */
  private async charge(
    uid: string,
    totalCents: number,
    orderId: string,
  ): Promise<string | null> {
    const customer = await this.asaasClient.findCustomerByExternalReference(uid)
    if (!customer) return null

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1)

    const payment = await this.asaasClient.createPayment({
      customer: customer.id,
      billingType: 'UNDEFINED',
      value: totalCents / 100,
      dueDate: dueDate.toISOString().slice(0, 10),
      externalReference: orderId,
    })

    await this.orderRepository.updateAsaasPaymentId(orderId, payment.id)

    return payment.invoiceUrl ?? payment.bankSlipUrl ?? null
  }
}
