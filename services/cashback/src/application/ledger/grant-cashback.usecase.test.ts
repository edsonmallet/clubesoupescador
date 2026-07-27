import { describe, expect, it, vi } from 'vitest'
import { GrantCashbackUseCase } from './grant-cashback.usecase'

function makeDeps() {
  const cashbackRepository = {
    getSummary: vi.fn(),
    credit: vi.fn(),
    debit: vi.fn(),
    getBalance: vi.fn(),
    getHistory: vi.fn(),
    getExpiring: vi.fn(),
  }
  const configRepository = {
    findBySource: vi.fn(),
    findAll: vi.fn(),
    upsert: vi.fn(),
  }

  return { cashbackRepository, configRepository }
}

describe('GrantCashbackUseCase', () => {
  it('credits amount = paidAmountCents * pct/100 using the source config', async () => {
    const deps = makeDeps()
    deps.configRepository.findBySource.mockResolvedValue({
      tenantId: 'tenant-1',
      source: 'earned_purchase',
      pct: 5,
      expiryMonths: 6,
    })

    const usecase = new GrantCashbackUseCase(
      deps.cashbackRepository,
      deps.configRepository,
    )

    await usecase.execute({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      source: 'earned_purchase',
      sourceId: 'order-1',
      paidAmountCents: 10000,
    })

    expect(deps.cashbackRepository.credit).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        uid: 'uid-1',
        type: 'earned_purchase',
        amountCents: 500,
        source: 'earned_purchase',
        sourceId: 'order-1',
      }),
    )
  })

  it('sets expiresAt to now + expiryMonths from the config', async () => {
    const deps = makeDeps()
    deps.configRepository.findBySource.mockResolvedValue({
      tenantId: 'tenant-1',
      source: 'earned_purchase',
      pct: 10,
      expiryMonths: 3,
    })

    const usecase = new GrantCashbackUseCase(
      deps.cashbackRepository,
      deps.configRepository,
    )

    const before = new Date()
    await usecase.execute({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      source: 'earned_purchase',
      sourceId: null,
      paidAmountCents: 10000,
    })

    const call = deps.cashbackRepository.credit.mock.calls[0][0]
    const expected = new Date(before)
    expected.setMonth(expected.getMonth() + 3)

    expect(call.expiresAt.getMonth()).toBe(expected.getMonth())
    expect(call.expiresAt.getFullYear()).toBe(expected.getFullYear())
  })

  it('does not write a ledger row when no config exists for the source', async () => {
    const deps = makeDeps()
    deps.configRepository.findBySource.mockResolvedValue(null)

    const usecase = new GrantCashbackUseCase(
      deps.cashbackRepository,
      deps.configRepository,
    )

    await usecase.execute({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      source: 'unknown_source',
      sourceId: null,
      paidAmountCents: 10000,
    })

    expect(deps.cashbackRepository.credit).not.toHaveBeenCalled()
  })

  it('does not write a ledger row when the source is configured at 0%', async () => {
    const deps = makeDeps()
    deps.configRepository.findBySource.mockResolvedValue({
      tenantId: 'tenant-1',
      source: 'earned_purchase',
      pct: 0,
      expiryMonths: 6,
    })

    const usecase = new GrantCashbackUseCase(
      deps.cashbackRepository,
      deps.configRepository,
    )

    await usecase.execute({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      source: 'earned_purchase',
      sourceId: null,
      paidAmountCents: 10000,
    })

    expect(deps.cashbackRepository.credit).not.toHaveBeenCalled()
  })

  it('rounds the credited amount to the nearest cent', async () => {
    const deps = makeDeps()
    deps.configRepository.findBySource.mockResolvedValue({
      tenantId: 'tenant-1',
      source: 'earned_purchase',
      pct: 3,
      expiryMonths: 6,
    })

    const usecase = new GrantCashbackUseCase(
      deps.cashbackRepository,
      deps.configRepository,
    )

    // 333 * 3 / 100 = 9.99 -> rounds to 10.
    await usecase.execute({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      source: 'earned_purchase',
      sourceId: null,
      paidAmountCents: 333,
    })

    expect(deps.cashbackRepository.credit).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 10 }),
    )
  })
})
