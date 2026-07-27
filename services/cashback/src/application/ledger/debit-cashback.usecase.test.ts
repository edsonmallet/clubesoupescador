import { describe, expect, it, vi } from 'vitest'
import { InsufficientCashbackError } from '../../domain/errors'
import { DebitCashbackUseCase } from './debit-cashback.usecase'

function makeDeps(availableCents: number) {
  const cashbackRepository = {
    getSummary: vi.fn(),
    credit: vi.fn(),
    debit: vi.fn(),
    getBalance: vi.fn().mockResolvedValue({
      availableCents,
      expiringSoonCents: 0,
      nextExpiryAt: null,
    }),
    getHistory: vi.fn(),
    getExpiring: vi.fn(),
  }

  return { cashbackRepository }
}

describe('DebitCashbackUseCase — per-order cashback limit', () => {
  it('debits the ledger when the amount is within the available balance', async () => {
    const deps = makeDeps(1000)
    const usecase = new DebitCashbackUseCase(deps.cashbackRepository)

    await usecase.execute({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      source: 'redeemed',
      sourceId: 'order-1',
      amountCents: 300,
    })

    expect(deps.cashbackRepository.debit).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      type: 'redeemed',
      amountCents: 300,
      source: 'redeemed',
      sourceId: 'order-1',
    })
  })

  it('allows debiting exactly the full available balance', async () => {
    const deps = makeDeps(500)
    const usecase = new DebitCashbackUseCase(deps.cashbackRepository)

    await usecase.execute({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      source: 'redeemed',
      sourceId: 'order-1',
      amountCents: 500,
    })

    expect(deps.cashbackRepository.debit).toHaveBeenCalled()
  })

  it('throws InsufficientCashbackError when the amount exceeds the balance', async () => {
    const deps = makeDeps(200)
    const usecase = new DebitCashbackUseCase(deps.cashbackRepository)

    await expect(
      usecase.execute({
        tenantId: 'tenant-1',
        uid: 'uid-1',
        source: 'redeemed',
        sourceId: 'order-1',
        amountCents: 201,
      }),
    ).rejects.toThrow(InsufficientCashbackError)

    expect(deps.cashbackRepository.debit).not.toHaveBeenCalled()
  })

  it('throws when trying to debit against a zero balance', async () => {
    const deps = makeDeps(0)
    const usecase = new DebitCashbackUseCase(deps.cashbackRepository)

    await expect(
      usecase.execute({
        tenantId: 'tenant-1',
        uid: 'uid-1',
        source: 'redeemed',
        sourceId: 'order-1',
        amountCents: 1,
      }),
    ).rejects.toThrow(InsufficientCashbackError)
  })
})
