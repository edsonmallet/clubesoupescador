import type { Ticket } from '../../domain/entities/Ticket'
import {
  AlreadyJoinedError,
  RaffleClosedError,
  RaffleNotFoundError,
} from '../../domain/errors'
import type { IRaffleRepository } from '../../domain/interfaces/IRaffleRepository'
import type { ISubscriptionsClient } from '../../domain/interfaces/ISubscriptionsClient'
import type { ITicketRepository } from '../../domain/interfaces/ITicketRepository'

const RAFFLE_JOIN_XP = 5

export type JoinRaffleInput = {
  uid: string
  tenantId: string
  raffleId: string
  authToken: string
}

export type JoinRaffleOutput = {
  tickets: Ticket[]
  count: number
}

export type EnqueueGrantXp = (data: {
  tenantId: string
  uid: string
  amount: number
  source: string
}) => Promise<void>

export class JoinRaffleUseCase {
  constructor(
    private readonly raffleRepository: IRaffleRepository,
    private readonly ticketRepository: ITicketRepository,
    private readonly subscriptionsClient: ISubscriptionsClient,
    private readonly enqueueGrantXp: EnqueueGrantXp,
  ) {}

  async execute(input: JoinRaffleInput): Promise<JoinRaffleOutput> {
    const raffle = await this.raffleRepository.findById(
      input.tenantId,
      input.raffleId,
    )
    if (!raffle) throw new RaffleNotFoundError(input.raffleId)
    if (!raffle.isOpen()) throw new RaffleClosedError(raffle.id)

    const alreadyJoined = await this.ticketRepository.hasJoinedBySource(
      input.tenantId,
      raffle.id,
      input.uid,
      'subscription_conversion',
    )
    if (alreadyJoined) {
      throw new AlreadyJoinedError(input.uid, raffle.id)
    }

    const subscriber = await this.subscriptionsClient.getSubscriber(
      input.uid,
      input.tenantId,
      input.authToken,
    )
    const planPriceCents = subscriber?.planId
      ? await this.subscriptionsClient.getPlanPriceCents(
          input.tenantId,
          subscriber.planId,
        )
      : null

    // No active plan resolvable (edge case route-level requireSubscriber
    // should already prevent) — one ticket is the safest floor rather than
    // failing the whole join.
    const count = planPriceCents
      ? Math.ceil(planPriceCents / raffle.ticketPriceCents)
      : 1

    const tickets = await this.ticketRepository.allocate({
      tenantId: input.tenantId,
      raffleId: raffle.id,
      uid: input.uid,
      qty: count,
      source: 'subscription_conversion',
      status: 'confirmed',
      asaasPaymentId: null,
      maxTickets: raffle.maxTickets,
    })

    await this.enqueueGrantXp({
      tenantId: input.tenantId,
      uid: input.uid,
      amount: RAFFLE_JOIN_XP,
      source: 'raffle_join',
    })

    return { tickets, count }
  }
}
