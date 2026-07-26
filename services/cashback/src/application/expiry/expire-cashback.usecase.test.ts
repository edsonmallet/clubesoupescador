import { describe, expect, it, vi } from 'vitest'
import { CashbackEntry } from '../../domain/entities/CashbackEntry'
import { ExpireCashbackUseCase } from './expire-cashback.usecase'

function makeEntry(
  overrides: Partial<Parameters<typeof CashbackEntry.create>[0]> = {},
) {
  return CashbackEntry.create({
    id: 'entry-1',
    tenantId: 'tenant-1',
    uid: 'uid-1',
    type: 'earned_purchase',
    amountCents: 500,
    source: 'earned_purchase',
    sourceId: 'order-1',
    expiresAt: new Date('2026-01-01'),
    createdAt: new Date('2025-07-01'),
    ...overrides,
  })
}

function makeDeps() {
  const cashbackRepository = {
    credit: vi.fn(),
    debit: vi.fn(),
    getBalance: vi.fn(),
    getHistory: vi.fn(),
    getExpiring: vi.fn().mockResolvedValue([]),
  }
  const enqueueGrantXp = vi.fn()

  return { cashbackRepository, enqueueGrantXp }
}

describe('ExpireCashbackUseCase', () => {
  it('converts each expired lot into an expired_to_xp debit for the full lot amount', async () => {
    const deps = makeDeps()
    const entry = makeEntry({ amountCents: 500 })
    deps.cashbackRepository.getExpiring.mockResolvedValue([entry])

    const usecase = new ExpireCashbackUseCase(
      deps.cashbackRepository,
      deps.enqueueGrantXp,
    )
    const processed = await usecase.execute()

    expect(processed).toBe(1)
    expect(deps.cashbackRepository.debit).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      type: 'expired_to_xp',
      amountCents: 500,
      source: 'expired_to_xp',
      sourceId: 'entry-1',
    })
  })

  it('grants 1 XP per R$0,10 expired (Math.floor(amountCents / 10))', async () => {
    const deps = makeDeps()
    // R$5,00 = 500 cents -> 50 XP.
    deps.cashbackRepository.getExpiring.mockResolvedValue([
      makeEntry({ amountCents: 500 }),
    ])

    const usecase = new ExpireCashbackUseCase(
      deps.cashbackRepository,
      deps.enqueueGrantXp,
    )
    await usecase.execute()

    expect(deps.enqueueGrantXp).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      amount: 50,
      source: 'cashback_expired',
    })
  })

  it('floors the XP bonus for amounts that are not a clean multiple of 10 cents', async () => {
    const deps = makeDeps()
    // 537 cents -> floor(537/10) = 53 XP, not 53.7.
    deps.cashbackRepository.getExpiring.mockResolvedValue([
      makeEntry({ amountCents: 537 }),
    ])

    const usecase = new ExpireCashbackUseCase(
      deps.cashbackRepository,
      deps.enqueueGrantXp,
    )
    await usecase.execute()

    expect(deps.enqueueGrantXp).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 53 }),
    )
  })

  it('processes multiple near-expiry lots independently', async () => {
    const deps = makeDeps()
    deps.cashbackRepository.getExpiring.mockResolvedValue([
      makeEntry({ id: 'entry-1', uid: 'uid-1', amountCents: 200 }),
      makeEntry({ id: 'entry-2', uid: 'uid-2', amountCents: 900 }),
    ])

    const usecase = new ExpireCashbackUseCase(
      deps.cashbackRepository,
      deps.enqueueGrantXp,
    )
    const processed = await usecase.execute()

    expect(processed).toBe(2)
    expect(deps.cashbackRepository.debit).toHaveBeenCalledTimes(2)
    expect(deps.enqueueGrantXp).toHaveBeenCalledTimes(2)
  })

  it('does not enqueue XP when the lot is too small to earn even 1 XP', async () => {
    const deps = makeDeps()
    // 5 cents -> floor(5/10) = 0 XP.
    deps.cashbackRepository.getExpiring.mockResolvedValue([
      makeEntry({ amountCents: 5 }),
    ])

    const usecase = new ExpireCashbackUseCase(
      deps.cashbackRepository,
      deps.enqueueGrantXp,
    )
    await usecase.execute()

    expect(deps.cashbackRepository.debit).toHaveBeenCalled()
    expect(deps.enqueueGrantXp).not.toHaveBeenCalled()
  })

  it('is a no-op when nothing has expired', async () => {
    const deps = makeDeps()
    const usecase = new ExpireCashbackUseCase(
      deps.cashbackRepository,
      deps.enqueueGrantXp,
    )

    const processed = await usecase.execute()

    expect(processed).toBe(0)
    expect(deps.cashbackRepository.debit).not.toHaveBeenCalled()
    expect(deps.enqueueGrantXp).not.toHaveBeenCalled()
  })
})
