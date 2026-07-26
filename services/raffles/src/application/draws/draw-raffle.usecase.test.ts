import { describe, expect, it, vi } from 'vitest'
import { Raffle } from '../../domain/entities/Raffle'
import { Ticket } from '../../domain/entities/Ticket'
import {
  RaffleClosedError,
  RaffleNotFoundError,
  TicketsSoldOutError,
} from '../../domain/errors'
import { DrawRaffleUseCase, pickWinnerIndex } from './draw-raffle.usecase'

function makeRaffle(
  overrides: Partial<Parameters<typeof Raffle.create>[0]> = {},
) {
  return Raffle.create({
    id: 'raffle-1',
    tenantId: 'tenant-1',
    title: 'Rifa do combo de pesca',
    description: 'Ganhe um combo completo',
    prize: 'Combo de pesca',
    imageUrl: null,
    ticketPriceCents: 50,
    status: 'open',
    contestNumber: null,
    winnerTicket: null,
    winnerUid: null,
    drawnAt: null,
    createdAt: new Date(),
    ...overrides,
  })
}

function makeTicket(
  overrides: Partial<Parameters<typeof Ticket.create>[0]> = {},
) {
  return Ticket.create({
    id: 'ticket-1',
    tenantId: 'tenant-1',
    raffleId: 'raffle-1',
    uid: 'uid-1',
    number: 1,
    status: 'confirmed',
    source: 'subscription_conversion',
    asaasPaymentId: null,
    createdAt: new Date(),
    ...overrides,
  })
}

function makeDeps() {
  const raffleRepository = {
    findMany: vi.fn(),
    findById: vi.fn().mockResolvedValue(makeRaffle()),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(makeRaffle()),
    setWinner: vi.fn().mockResolvedValue(makeRaffle({ status: 'drawn' })),
  }
  const ticketRepository = {
    allocate: vi.fn(),
    findByUidAndRaffle: vi.fn(),
    hasJoinedBySource: vi.fn(),
    findConfirmedByRaffle: vi
      .fn()
      .mockResolvedValue([
        makeTicket({ id: 't-1', uid: 'uid-1', number: 1 }),
        makeTicket({ id: 't-2', uid: 'uid-2', number: 2 }),
        makeTicket({ id: 't-3', uid: 'uid-3', number: 3 }),
      ]),
    confirmByAsaasPaymentId: vi.fn(),
  }
  const loteriaFederalClient = {
    getResult: vi.fn().mockResolvedValue({
      contestNumber: 5900,
      drawnNumbers: ['12345', '67890', '11111', '22222', '33333'],
    }),
  }
  const notifier = { notifyRaffleWinner: vi.fn() }
  const enqueueGrantXp = vi.fn()

  return {
    raffleRepository,
    ticketRepository,
    loteriaFederalClient,
    notifier,
    enqueueGrantXp,
  }
}

function makeUseCase(deps: ReturnType<typeof makeDeps>) {
  return new DrawRaffleUseCase(
    deps.raffleRepository,
    deps.ticketRepository,
    deps.loteriaFederalClient as never,
    deps.notifier,
    deps.enqueueGrantXp,
  )
}

describe('DrawRaffleUseCase', () => {
  it('picks a winner deterministically from the Loteria Federal contest numbers', async () => {
    const deps = makeDeps()
    const usecase = makeUseCase(deps)

    const result = await usecase.execute({
      tenantId: 'tenant-1',
      raffleId: 'raffle-1',
      contestNumber: 5900,
    })

    expect(deps.loteriaFederalClient.getResult).toHaveBeenCalledWith(5900)
    expect([1, 2, 3]).toContain(result.winnerTicket)
    expect(result.contestNumber).toBe(5900)
  })

  it('produces the same winner for the same drawn numbers and ticket count (determinism)', () => {
    const drawnNumbers = ['12345', '67890', '11111', '22222', '33333']
    const first = pickWinnerIndex(drawnNumbers, 100)
    const second = pickWinnerIndex(drawnNumbers, 100)
    expect(first).toBe(second)
  })

  it('produces a different index for different drawn numbers (not a constant)', () => {
    const a = pickWinnerIndex(
      ['00000', '00000', '00000', '00000', '00000'],
      1000,
    )
    const b = pickWinnerIndex(
      ['99999', '88888', '77777', '66666', '55555'],
      1000,
    )
    expect(a).not.toBe(b)
  })

  it('always returns an index within [0, ticketCount)', () => {
    for (let i = 0; i < 20; i++) {
      const drawnNumbers = [String(i), '11111', '22222', '33333', '44444']
      const index = pickWinnerIndex(drawnNumbers, 7)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(7)
    }
  })

  it('persists the winner ticket and uid on the raffle', async () => {
    const deps = makeDeps()
    const usecase = makeUseCase(deps)

    await usecase.execute({
      tenantId: 'tenant-1',
      raffleId: 'raffle-1',
      contestNumber: 5900,
    })

    expect(deps.raffleRepository.setWinner).toHaveBeenCalledWith(
      'raffle-1',
      expect.any(Number),
      expect.stringMatching(/^uid-/),
      expect.any(Date),
    )
    expect(deps.raffleRepository.update).toHaveBeenCalledWith('raffle-1', {
      contestNumber: 5900,
    })
  })

  it('notifies the winner and grants bonus XP', async () => {
    const deps = makeDeps()
    const usecase = makeUseCase(deps)

    await usecase.execute({
      tenantId: 'tenant-1',
      raffleId: 'raffle-1',
      contestNumber: 5900,
    })

    expect(deps.notifier.notifyRaffleWinner).toHaveBeenCalled()
    expect(deps.enqueueGrantXp).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'raffle_winner', amount: 50 }),
    )
  })

  it('throws RaffleNotFoundError when the raffle does not exist', async () => {
    const deps = makeDeps()
    deps.raffleRepository.findById.mockResolvedValue(null)
    const usecase = makeUseCase(deps)

    await expect(
      usecase.execute({
        tenantId: 'tenant-1',
        raffleId: 'missing',
        contestNumber: 1,
      }),
    ).rejects.toThrow(RaffleNotFoundError)
  })

  it('throws RaffleClosedError when the raffle was already drawn', async () => {
    const deps = makeDeps()
    deps.raffleRepository.findById.mockResolvedValue(
      makeRaffle({ status: 'drawn' }),
    )
    const usecase = makeUseCase(deps)

    await expect(
      usecase.execute({
        tenantId: 'tenant-1',
        raffleId: 'raffle-1',
        contestNumber: 1,
      }),
    ).rejects.toThrow(RaffleClosedError)
  })

  it('throws TicketsSoldOutError when there are no confirmed tickets to draw from', async () => {
    const deps = makeDeps()
    deps.ticketRepository.findConfirmedByRaffle.mockResolvedValue([])
    const usecase = makeUseCase(deps)

    await expect(
      usecase.execute({
        tenantId: 'tenant-1',
        raffleId: 'raffle-1',
        contestNumber: 1,
      }),
    ).rejects.toThrow(TicketsSoldOutError)
  })
})
