import { createHash } from 'node:crypto'
import {
  RaffleClosedError,
  RaffleNotFoundError,
  TicketsSoldOutError,
} from '../../domain/errors'
import type { INotifier } from '../../domain/interfaces/INotifier'
import type { IRaffleRepository } from '../../domain/interfaces/IRaffleRepository'
import type { ITicketRepository } from '../../domain/interfaces/ITicketRepository'
import type { LoteriaFederalClient } from '../../infrastructure/external/loteria-federal/client'

const RAFFLE_WINNER_XP = 50

export type DrawRaffleInput = {
  tenantId: string
  raffleId: string
  contestNumber: number
}

export type DrawRaffleOutput = {
  contestNumber: number
  winnerTicket: number
  winnerUid: string
}

export type EnqueueGrantXp = (data: {
  tenantId: string
  uid: string
  amount: number
  source: string
}) => Promise<void>

export class DrawRaffleUseCase {
  constructor(
    private readonly raffleRepository: IRaffleRepository,
    private readonly ticketRepository: ITicketRepository,
    private readonly loteriaFederalClient: LoteriaFederalClient,
    private readonly notifier: INotifier,
    private readonly enqueueGrantXp: EnqueueGrantXp,
  ) {}

  async execute(input: DrawRaffleInput): Promise<DrawRaffleOutput> {
    const raffle = await this.raffleRepository.findById(
      input.tenantId,
      input.raffleId,
    )
    if (!raffle) throw new RaffleNotFoundError(input.raffleId)
    if (raffle.status === 'drawn') throw new RaffleClosedError(raffle.id)

    const tickets = await this.ticketRepository.findConfirmedByRaffle(
      input.tenantId,
      raffle.id,
    )
    if (tickets.length === 0) throw new TicketsSoldOutError(raffle.id)

    const result = await this.loteriaFederalClient.getResult(
      raffle.lotteryGame,
      input.contestNumber,
    )

    const winnerIndex = pickWinnerIndex(result.drawnNumbers, tickets.length)
    const winner = tickets[winnerIndex]

    await this.raffleRepository.setWinner(
      raffle.id,
      winner.number,
      winner.uid,
      new Date(),
    )
    await this.raffleRepository.update(raffle.id, {
      contestNumber: input.contestNumber,
    })

    await this.notifier.notifyRaffleWinner(
      winner.uid,
      raffle.title,
      winner.number,
    )

    await this.enqueueGrantXp({
      tenantId: input.tenantId,
      uid: winner.uid,
      amount: RAFFLE_WINNER_XP,
      source: 'raffle_winner',
    })

    return {
      contestNumber: input.contestNumber,
      winnerTicket: winner.number,
      winnerUid: winner.uid,
    }
  }
}

/**
 * Deterministic: the same drawn numbers always pick the same ticket index
 * for a given ticket count, so the result is reproducible/auditable from
 * the public Loteria Federal contest alone — no internal randomness.
 */
export function pickWinnerIndex(
  drawnNumbers: string[],
  ticketCount: number,
): number {
  const seed = drawnNumbers.join('')
  const digest = createHash('sha256').update(seed).digest('hex')
  const asBigInt = BigInt(`0x${digest}`)
  return Number(asBigInt % BigInt(ticketCount))
}
