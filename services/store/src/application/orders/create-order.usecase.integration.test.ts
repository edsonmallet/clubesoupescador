import { createDbClient } from '@clube/db-client'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { OutOfStockError } from '../../domain/errors'
import { OrderRepository } from '../../infrastructure/db/repositories/order.repository'
import { ProductRepository } from '../../infrastructure/db/repositories/product.repository'
import { schema } from '../../infrastructure/db/schema'
import { CreateOrderUseCase } from './create-order.usecase'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

const ADDRESS = {
  zipCode: '01310100',
  street: 'Av. Paulista',
  number: '1000',
  complement: null,
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
}

describe('CreateOrderUseCase (real database)', () => {
  let container: StartedPostgreSqlContainer
  let db: NodePgDatabase<typeof schema>
  let productRepository: ProductRepository
  let orderRepository: OrderRepository

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    db = createDbClient(schema, container.getConnectionUri())
    await migrate(db, {
      migrationsFolder: './src/infrastructure/db/migrations',
    })
    productRepository = new ProductRepository(db)
    orderRepository = new OrderRepository(db)
  }, 60_000)

  afterAll(async () => {
    await container.stop()
  })

  async function seedProduct(overrides: { stock?: number } = {}) {
    return productRepository.create({
      tenantId: TENANT_ID,
      name: 'Isca artificial',
      description: 'Isca para pesca esportiva',
      priceFullCents: 15000,
      priceClubCents: 10000,
      stock: overrides.stock ?? 5,
      sku: `ISCA-${Math.random().toString(36).slice(2, 8)}`,
      images: [],
      active: true,
    })
  }

  function makeUseCase() {
    const subscriptionsClient = {
      getSubscriber: vi
        .fn()
        .mockResolvedValue({ status: 'active', levelId: 'level-1' }),
      getLevelDiscount: vi
        .fn()
        .mockResolvedValue({ storeDiscountPct: 10, cashbackPct: 4 }),
    }
    const asaasClient = {
      findCustomerByExternalReference: vi
        .fn()
        .mockResolvedValue({ id: 'cus_1' }),
      createPayment: vi.fn().mockResolvedValue({
        id: 'pay_1',
        invoiceUrl: 'https://pay.asaas.com/x',
      }),
    }
    const enqueueCashbackDebit = vi.fn()

    const usecase = new CreateOrderUseCase(
      productRepository,
      orderRepository,
      subscriptionsClient,
      asaasClient as never,
      enqueueCashbackDebit,
    )

    return { usecase, subscriptionsClient, asaasClient, enqueueCashbackDebit }
  }

  it('creates the order, decrements stock, and stores the Asaas payment id', async () => {
    const product = await seedProduct({ stock: 5 })
    const { usecase } = makeUseCase()

    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: TENANT_ID,
      authToken: 'token',
      items: [{ productId: product.id, qty: 2 }],
      cashbackUseCents: 0,
      address: ADDRESS,
    })

    expect(result.totalCents).toBe(2 * 10000 - 2000) // 10% level discount
    expect(result.paymentUrl).toBe('https://pay.asaas.com/x')

    const updatedProduct = await productRepository.findById(
      TENANT_ID,
      product.id,
    )
    expect(updatedProduct?.stock).toBe(3)

    const order = await orderRepository.findById(TENANT_ID, result.orderId)
    expect(order?.asaasPaymentId).toBe('pay_1')
    expect(order?.status).toBe('pending')
  })

  it('rolls back the whole order when stock is insufficient', async () => {
    const product = await seedProduct({ stock: 1 })
    const { usecase } = makeUseCase()

    await expect(
      usecase.execute({
        uid: 'uid-2',
        tenantId: TENANT_ID,
        authToken: 'token',
        items: [{ productId: product.id, qty: 5 }],
        cashbackUseCents: 0,
        address: ADDRESS,
      }),
    ).rejects.toThrow(OutOfStockError)

    const untouchedProduct = await productRepository.findById(
      TENANT_ID,
      product.id,
    )
    expect(untouchedProduct?.stock).toBe(1)

    const orders = await orderRepository.findMany(TENANT_ID, 'uid-2', 1, 20)
    expect(orders.total).toBe(0)
  })
})
