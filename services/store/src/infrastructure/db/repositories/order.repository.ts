import { and, eq, gte, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Order, type OrderStatus } from '../../../domain/entities/Order'
import { OutOfStockError } from '../../../domain/errors'
import type {
  CreateOrderDto,
  IOrderRepository,
  OrdersSummary,
} from '../../../domain/interfaces/IOrderRepository'
import type { PaginatedResult } from '../../../domain/interfaces/IProductRepository'
import type { schema } from '../schema'
import { orderItems, orders, products } from '../schema/store'

type OrderRow = typeof orders.$inferSelect
type OrderItemRow = typeof orderItems.$inferSelect

function toDomain(row: OrderRow, items: OrderItemRow[]): Order {
  return Order.create({
    id: row.id,
    tenantId: row.tenantId,
    uid: row.firebaseUid,
    status: row.status,
    levelId: row.levelId,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
      discountPct: Number(item.discountPct),
    })),
    subtotalCents: row.subtotalCents,
    levelDiscountAmtCents: row.levelDiscountAmtCents,
    cashbackUsedAmtCents: row.cashbackUsedAmtCents,
    shippingAmtCents: row.shippingAmtCents,
    totalCents: row.totalCents,
    asaasPaymentId: row.asaasPaymentId,
    trackingCode: row.trackingCode,
    shippingLabelUrl: row.shippingLabelUrl,
    address: row.address,
    createdAt: row.createdAt,
  })
}

export class OrderRepository implements IOrderRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async getSummary(tenantId: string): Promise<OrdersSummary> {
    const [[{ revenueCentsThisMonth }], [{ pendingOrders }]] = await Promise.all([
      this.db
        .select({
          revenueCentsThisMonth: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        })
        .from(orders)
        .where(
          sql`${orders.tenantId} = ${tenantId} and ${orders.status} = 'paid' and ${orders.createdAt} >= date_trunc('month', now())`,
        ),
      this.db
        .select({ pendingOrders: sql<number>`count(*)::int` })
        .from(orders)
        .where(sql`${orders.tenantId} = ${tenantId} and ${orders.status} = 'paid'`),
    ])

    return { revenueCentsThisMonth, pendingOrders }
  }

  /**
   * Creates the order, its line items, and decrements product stock in a
   * single transaction: either the whole purchase commits, or none of it
   * does — a failed stock decrement (concurrent sellout) must not leave a
   * dangling paid-for order with no inventory backing it.
   */
  async create(data: CreateOrderDto): Promise<Order> {
    return this.db.transaction(async (tx) => {
      const [orderRow] = await tx
        .insert(orders)
        .values({
          tenantId: data.tenantId,
          firebaseUid: data.uid,
          status: data.status,
          levelId: data.levelId,
          subtotalCents: data.subtotalCents,
          levelDiscountAmtCents: data.levelDiscountAmtCents,
          cashbackUsedAmtCents: data.cashbackUsedAmtCents,
          shippingAmtCents: data.shippingAmtCents,
          totalCents: data.totalCents,
          asaasPaymentId: data.asaasPaymentId,
          address: data.address,
        })
        .returning()

      const itemRows: OrderItemRow[] = []
      for (const item of data.items) {
        const stockUpdate = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.qty}` })
          .where(
            and(eq(products.id, item.productId), gte(products.stock, item.qty)),
          )
          .returning({ id: products.id })

        if (stockUpdate.length === 0) {
          throw new OutOfStockError(item.productId)
        }

        const [itemRow] = await tx
          .insert(orderItems)
          .values({
            orderId: orderRow.id,
            productId: item.productId,
            qty: item.qty,
            unitPriceCents: item.unitPriceCents,
            discountPct: item.discountPct.toString(),
          })
          .returning()

        itemRows.push(itemRow as OrderItemRow)
      }

      return toDomain(orderRow as OrderRow, itemRows)
    })
  }

  async findMany(
    tenantId: string,
    uid: string | null,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Order>> {
    const conditions = [eq(orders.tenantId, tenantId)]
    if (uid) conditions.push(eq(orders.firebaseUid, uid))
    const where = and(...conditions)

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .where(where)
        .limit(perPage)
        .offset((page - 1) * perPage),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(where),
    ])

    const items = await Promise.all(
      rows.map(async (row) => {
        const itemRows = await this.db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, row.id))
        return toDomain(row, itemRows)
      }),
    )

    return { items, total: count }
  }

  async findById(tenantId: string, id: string): Promise<Order | null> {
    const [row] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)))
      .limit(1)

    if (!row) return null

    const itemRows = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, row.id))

    return toDomain(row, itemRows)
  }

  async findByAsaasPaymentId(asaasPaymentId: string): Promise<Order | null> {
    const [row] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.asaasPaymentId, asaasPaymentId))
      .limit(1)

    if (!row) return null

    const itemRows = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, row.id))

    return toDomain(row, itemRows)
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const [row] = await this.db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning()

    const itemRows = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, row.id))

    return toDomain(row as OrderRow, itemRows)
  }

  async updateAsaasPaymentId(
    id: string,
    asaasPaymentId: string,
  ): Promise<Order> {
    const [row] = await this.db
      .update(orders)
      .set({ asaasPaymentId })
      .where(eq(orders.id, id))
      .returning()

    const itemRows = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, row.id))

    return toDomain(row as OrderRow, itemRows)
  }

  async updateTracking(
    id: string,
    trackingCode: string,
    shippingLabelUrl: string | null,
  ): Promise<Order> {
    const [row] = await this.db
      .update(orders)
      .set({ trackingCode, shippingLabelUrl })
      .where(eq(orders.id, id))
      .returning()

    const itemRows = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, row.id))

    return toDomain(row as OrderRow, itemRows)
  }
}
