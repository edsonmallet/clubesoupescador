import { DomainError } from './domain-error'

export class RaffleNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Raffle ${id} not found`, 'RAFFLE_NOT_FOUND', 404)
  }
}

export class RaffleClosedError extends DomainError {
  constructor(id: string) {
    super(`Raffle ${id} is not open`, 'RAFFLE_CLOSED', 409)
  }
}

export class AlreadyJoinedError extends DomainError {
  constructor(uid: string, raffleId: string) {
    super(`${uid} already joined raffle ${raffleId}`, 'ALREADY_JOINED', 409)
  }
}

export class TicketsSoldOutError extends DomainError {
  constructor(id: string) {
    super(`Raffle ${id} has no tickets left`, 'TICKETS_SOLD_OUT', 409)
  }
}

export { DomainError }
