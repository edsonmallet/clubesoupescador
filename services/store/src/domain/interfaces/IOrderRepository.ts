import type { Order, OrderAddress, OrderStatus } from '../entities/Order'
import type { PaginatedResult } from './IProductRepository'

export type CreateOrderItemDto = {
  productId: string
  qty: number
  unitPriceCents: number
  discountPct: number
}

export type CreateOrderDto = {
  tenantId: string
  uid: string
  status: OrderStatus
  levelId: string | null
  items: CreateOrderItemDto[]
  subtotalCents: number
  levelDiscountAmtCents: number
  cashbackUsedAmtCents: number
  shippingAmtCents: number
  totalCents: number
  asaasPaymentId: string | null
  address: OrderAddress
}

export type OrdersSummary = {
  revenueCentsThisMonth: number
  pendingOrders: number
}

export interface IOrderRepository {
  create(data: CreateOrderDto): Promise<Order>
  getSummary(tenantId: string): Promise<OrdersSummary>
  findMany(
    tenantId: string,
    uid: string | null,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Order>>
  findById(tenantId: string, id: string): Promise<Order | null>
  findByAsaasPaymentId(asaasPaymentId: string): Promise<Order | null>
  updateStatus(id: string, status: OrderStatus): Promise<Order>
  updateAsaasPaymentId(id: string, asaasPaymentId: string): Promise<Order>
  updateTracking(
    id: string,
    trackingCode: string,
    shippingLabelUrl: string | null,
  ): Promise<Order>
}
