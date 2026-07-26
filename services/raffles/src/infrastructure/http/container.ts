import { DrawRaffleUseCase } from '../../application/draws/draw-raffle.usecase'
import { ListRafflesUseCase } from '../../application/raffles/list-raffles.usecase'
import { BuyTicketsUseCase } from '../../application/tickets/buy-tickets.usecase'
import { JoinRaffleUseCase } from '../../application/tickets/join-raffle.usecase'
import { db } from '../db'
import { RaffleRepository } from '../db/repositories/raffle.repository'
import { TicketRepository } from '../db/repositories/ticket.repository'
import { getAsaasClient } from '../external/asaas/client'
import { CommunityClient } from '../external/community/client'
import { LoteriaFederalClient } from '../external/loteria-federal/client'
import { FcmNotifier } from '../external/notifications/fcm-notifier'
import { SubscriptionsClient } from '../external/subscriptions/client'
import { enqueueGrantXp } from '../queue/cross-service.queue'
import {
  enqueueConfirmTickets,
  enqueueDrawRaffle,
} from '../queue/raffles.queue'
import {
  rafflesAuthPreHandler,
  requireAuth,
  requireOwner,
  requireSubscriber,
} from './proxy'

export const raffleRepository = new RaffleRepository(db)
export const ticketRepository = new TicketRepository(db)
export const subscriptionsClient = new SubscriptionsClient()
export const loteriaFederalClient = new LoteriaFederalClient()
export const notifier = new FcmNotifier()
export const communityClient = new CommunityClient()

export const listRafflesUseCase = new ListRafflesUseCase(raffleRepository)

export const joinRaffleUseCase = new JoinRaffleUseCase(
  raffleRepository,
  ticketRepository,
  subscriptionsClient,
  enqueueGrantXp,
)

export const buyTicketsUseCase = new BuyTicketsUseCase(
  raffleRepository,
  ticketRepository,
  getAsaasClient(),
)

export const drawRaffleUseCase = new DrawRaffleUseCase(
  raffleRepository,
  ticketRepository,
  loteriaFederalClient,
  notifier,
  enqueueGrantXp,
)

export {
  enqueueConfirmTickets,
  enqueueDrawRaffle,
  rafflesAuthPreHandler,
  requireAuth,
  requireOwner,
  requireSubscriber,
}
