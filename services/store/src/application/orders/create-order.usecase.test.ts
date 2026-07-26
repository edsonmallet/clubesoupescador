import { describe, expect, it, vi } from 'vitest'
import { Product } from '../../domain/entities/Product'
import { ProductNotFoundError } from '../../domain/errors'
import { CreateOrderUseCase } from './create-order.usecase'

function makeProduct(
  overrides: Partial<Parameters<typeof Product.create>[0]> = {},
) {
  return Product.create({
    id: 'product-1',
    tenantId: 'tenant-1',
    name: 'Isca artificial',
    description: 'Isca para pesca esportiva',
    priceFullCents: 15000,
    priceClubCents: 10000,
    stock: 50,
    sku: 'ISCA-1',
    images: [],
    active: true,
    createdAt: new Date(),
    ...overrides,
  })
}

function makeDeps() {
  const productRepository = {
    findMany: vi.fn(),
    findById: vi.fn().mockResolvedValue(makeProduct()),
    updateStock: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }
  const orderRepository = {
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'order-1',
        tenantId: data.tenantId,
        uid: data.uid,
        status: data.status,
        levelId: data.levelId,
        items: data.items.map((item: unknown, index: number) => ({
          id: `item-${index}`,
          ...(item as object),
        })),
        subtotalCents: data.subtotalCents,
        levelDiscountAmtCents: data.levelDiscountAmtCents,
        cashbackUsedAmtCents: data.cashbackUsedAmtCents,
        shippingAmtCents: data.shippingAmtCents,
        totalCents: data.totalCents,
        asaasPaymentId: data.asaasPaymentId,
        trackingCode: null,
        shippingLabelUrl: null,
        address: data.address,
        createdAt: new Date(),
      }),
    ),
    findMany: vi.fn(),
    findById: vi.fn(),
    findByAsaasPaymentId: vi.fn(),
    updateStatus: vi.fn(),
    updateAsaasPaymentId: vi.fn(),
    updateTracking: vi.fn(),
  }
  const subscriptionsClient = {
    getSubscriber: vi
      .fn()
      .mockResolvedValue({ status: 'active', levelId: null }),
    getLevelDiscount: vi.fn().mockResolvedValue(null),
  }
  const asaasClient = {
    findCustomerByExternalReference: vi.fn().mockResolvedValue({ id: 'cus_1' }),
    createPayment: vi.fn().mockResolvedValue({
      id: 'pay_1',
      invoiceUrl: 'https://pay.asaas.com/x',
    }),
  }
  const enqueueCashbackDebit = vi.fn()

  return {
    productRepository,
    orderRepository,
    subscriptionsClient,
    asaasClient,
    enqueueCashbackDebit,
  }
}

function makeUseCase(deps: ReturnType<typeof makeDeps>) {
  return new CreateOrderUseCase(
    deps.productRepository,
    deps.orderRepository,
    deps.subscriptionsClient,
    deps.asaasClient as never,
    deps.enqueueCashbackDebit,
  )
}

const ADDRESS = {
  zipCode: '01310100',
  street: 'Av. Paulista',
  number: '1000',
  complement: null,
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
}

describe('CreateOrderUseCase — level discount matrix', () => {
  // subtotal fixed at 10000 cents (product priceClubCents) for qty 1.
  it.each([
    {
      level: 'Bronze',
      storeDiscountPct: 5,
      cashbackPct: 3,
      expectedDiscount: 500,
    },
    {
      level: 'Prata',
      storeDiscountPct: 10,
      cashbackPct: 4,
      expectedDiscount: 1000,
    },
    {
      level: 'Ouro',
      storeDiscountPct: 15,
      cashbackPct: 5,
      expectedDiscount: 1500,
    },
    {
      level: 'Diamante',
      storeDiscountPct: 20,
      cashbackPct: 6,
      expectedDiscount: 2000,
    },
    {
      level: 'Lenda',
      storeDiscountPct: 25,
      cashbackPct: 8,
      expectedDiscount: 2500,
    },
  ])(
    'applies $level ($storeDiscountPct%) discount correctly',
    async ({ storeDiscountPct, cashbackPct, expectedDiscount }) => {
      const deps = makeDeps()
      deps.subscriptionsClient.getSubscriber.mockResolvedValue({
        status: 'active',
        levelId: 'level-1',
      })
      deps.subscriptionsClient.getLevelDiscount.mockResolvedValue({
        storeDiscountPct,
        cashbackPct,
      })

      const usecase = makeUseCase(deps)
      const result = await usecase.execute({
        uid: 'uid-1',
        tenantId: 'tenant-1',
        authToken: 'token',
        items: [{ productId: 'product-1', qty: 1 }],
        cashbackUseCents: 0,
        address: ADDRESS,
      })

      const afterDiscount = 10000 - expectedDiscount
      expect(result.totalCents).toBe(afterDiscount)
      expect(deps.orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          levelDiscountAmtCents: expectedDiscount,
          totalCents: afterDiscount,
        }),
      )
    },
  )

  it('applies zero discount when the subscriber has no level yet', async () => {
    const deps = makeDeps()
    const usecase = makeUseCase(deps)

    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      authToken: 'token',
      items: [{ productId: 'product-1', qty: 1 }],
      cashbackUseCents: 0,
      address: ADDRESS,
    })

    expect(result.totalCents).toBe(10000)
  })

  it('caps cashback at 30% of the post-discount amount', async () => {
    const deps = makeDeps()
    deps.subscriptionsClient.getSubscriber.mockResolvedValue({
      status: 'active',
      levelId: 'level-1',
    })
    deps.subscriptionsClient.getLevelDiscount.mockResolvedValue({
      storeDiscountPct: 10,
      cashbackPct: 4,
    })

    // Subtotal 10000, discount 10% -> afterDiscount 9000, cap = 30% of 9000 = 2700.
    const usecase = makeUseCase(deps)
    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      authToken: 'token',
      items: [{ productId: 'product-1', qty: 1 }],
      cashbackUseCents: 5000, // requests far more than the cap
      address: ADDRESS,
    })

    expect(result.cashbackAppliedCents).toBe(2700)
    expect(result.totalCents).toBe(9000 - 2700)
    expect(deps.enqueueCashbackDebit).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 2700 }),
    )
  })

  it('applies cashback in full when it is under the 30% cap', async () => {
    const deps = makeDeps()
    const usecase = makeUseCase(deps)

    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      authToken: 'token',
      items: [{ productId: 'product-1', qty: 1 }],
      cashbackUseCents: 1000, // 10% of subtotal, under the 30% cap
      address: ADDRESS,
    })

    expect(result.cashbackAppliedCents).toBe(1000)
    expect(result.totalCents).toBe(9000)
  })

  it('does not enqueue a cashback debit when none is used', async () => {
    const deps = makeDeps()
    const usecase = makeUseCase(deps)

    await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      authToken: 'token',
      items: [{ productId: 'product-1', qty: 1 }],
      cashbackUseCents: 0,
      address: ADDRESS,
    })

    expect(deps.enqueueCashbackDebit).not.toHaveBeenCalled()
  })

  it('throws ProductNotFoundError for an inactive or missing product', async () => {
    const deps = makeDeps()
    deps.productRepository.findById.mockResolvedValue(null)
    const usecase = makeUseCase(deps)

    await expect(
      usecase.execute({
        uid: 'uid-1',
        tenantId: 'tenant-1',
        authToken: 'token',
        items: [{ productId: 'missing', qty: 1 }],
        cashbackUseCents: 0,
        address: ADDRESS,
      }),
    ).rejects.toThrow(ProductNotFoundError)
  })

  it('persists the asaas payment id and returns its invoice URL', async () => {
    const deps = makeDeps()
    const usecase = makeUseCase(deps)

    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      authToken: 'token',
      items: [{ productId: 'product-1', qty: 1 }],
      cashbackUseCents: 0,
      address: ADDRESS,
    })

    expect(deps.orderRepository.updateAsaasPaymentId).toHaveBeenCalledWith(
      'order-1',
      'pay_1',
    )
    expect(result.paymentUrl).toBe('https://pay.asaas.com/x')
  })
})
