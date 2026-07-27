import { describe, expect, it, vi } from 'vitest'
import { Raffle } from '../../domain/entities/Raffle'
import { Ticket } from '../../domain/entities/Ticket'
import {
  AlreadyJoinedError,
  RaffleClosedError,
  RaffleNotFoundError,
} from '../../domain/errors'
import { JoinRaffleUseCase } from './join-raffle.usecase'

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
    ticketPriceCents: 50, // R$0,50
    maxTickets: null,
    drawDate: null,
    lotteryGame: 'federal',
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
    update: vi.fn(),
    setWinner: vi.fn(),
  }
  const ticketRepository = {
    allocate: vi
      .fn()
      .mockImplementation(({ qty, ...rest }) =>
        Promise.resolve(
          Array.from({ length: qty }, (_, i) =>
            makeTicket({ id: `ticket-${i + 1}`, number: i + 1, ...rest }),
          ),
        ),
      ),
    findByUidAndRaffle: vi.fn(),
    hasJoinedBySource: vi.fn().mockResolvedValue(false),
    findConfirmedByRaffle: vi.fn(),
    confirmByAsaasPaymentId: vi.fn(),
  }
  const subscriptionsClient = {
    getSubscriber: vi
      .fn()
      .mockResolvedValue({ status: 'active', planId: 'plan-1' }),
    getPlanPriceCents: vi.fn().mockResolvedValue(2990), // R$29,90
  }
  const enqueueGrantXp = vi.fn()

  return {
    raffleRepository,
    ticketRepository,
    subscriptionsClient,
    enqueueGrantXp,
  }
}

function makeUseCase(deps: ReturnType<typeof makeDeps>) {
  return new JoinRaffleUseCase(
    deps.raffleRepository,
    deps.ticketRepository,
    deps.subscriptionsClient,
    deps.enqueueGrantXp,
  )
}

describe('JoinRaffleUseCase', () => {
  it('converts R$29,90 / R$0,50 into 60 tickets (ceil(29.90/0.50))', async () => {
    const deps = makeDeps()
    const usecase = makeUseCase(deps)

    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      raffleId: 'raffle-1',
      authToken: 'token',
    })

    expect(result.count).toBe(60)
    expect(result.tickets).toHaveLength(60)
    expect(deps.ticketRepository.allocate).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        raffleId: 'raffle-1',
        uid: 'uid-1',
        qty: 60,
        source: 'subscription_conversion',
        status: 'confirmed',
      }),
    )
  })

  it('rounds up a non-exact division (ceil, never floor)', async () => {
    const deps = makeDeps()
    deps.subscriptionsClient.getPlanPriceCents.mockResolvedValue(101) // R$1,01
    deps.raffleRepository.findById.mockResolvedValue(
      makeRaffle({ ticketPriceCents: 100 }), // R$1,00 per ticket
    )
    const usecase = makeUseCase(deps)

    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      raffleId: 'raffle-1',
      authToken: 'token',
    })

    // 101 / 100 = 1.01 -> ceil = 2, not 1.
    expect(result.count).toBe(2)
  })

  it('grants raffle-join XP after allocating tickets', async () => {
    const deps = makeDeps()
    const usecase = makeUseCase(deps)

    await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      raffleId: 'raffle-1',
      authToken: 'token',
    })

    expect(deps.enqueueGrantXp).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      uid: 'uid-1',
      amount: 5,
      source: 'raffle_join',
    })
  })

  it('throws RaffleNotFoundError when the raffle does not exist', async () => {
    const deps = makeDeps()
    deps.raffleRepository.findById.mockResolvedValue(null)
    const usecase = makeUseCase(deps)

    await expect(
      usecase.execute({
        uid: 'uid-1',
        tenantId: 'tenant-1',
        raffleId: 'missing',
        authToken: 'token',
      }),
    ).rejects.toThrow(RaffleNotFoundError)
  })

  it('throws RaffleClosedError when the raffle is not open', async () => {
    const deps = makeDeps()
    deps.raffleRepository.findById.mockResolvedValue(
      makeRaffle({ status: 'closed' }),
    )
    const usecase = makeUseCase(deps)

    await expect(
      usecase.execute({
        uid: 'uid-1',
        tenantId: 'tenant-1',
        raffleId: 'raffle-1',
        authToken: 'token',
      }),
    ).rejects.toThrow(RaffleClosedError)
  })

  it('throws AlreadyJoinedError when the member already converted their subscription into tickets', async () => {
    const deps = makeDeps()
    deps.ticketRepository.hasJoinedBySource.mockResolvedValue(true)
    const usecase = makeUseCase(deps)

    await expect(
      usecase.execute({
        uid: 'uid-1',
        tenantId: 'tenant-1',
        raffleId: 'raffle-1',
        authToken: 'token',
      }),
    ).rejects.toThrow(AlreadyJoinedError)

    expect(deps.ticketRepository.allocate).not.toHaveBeenCalled()
  })

  it('falls back to 1 ticket when the subscriber has no resolvable plan price', async () => {
    const deps = makeDeps()
    deps.subscriptionsClient.getSubscriber.mockResolvedValue(null)
    const usecase = makeUseCase(deps)

    const result = await usecase.execute({
      uid: 'uid-1',
      tenantId: 'tenant-1',
      raffleId: 'raffle-1',
      authToken: 'token',
    })

    expect(result.count).toBe(1)
  })
})
