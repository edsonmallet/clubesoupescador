import { DomainError } from './domain-error'

export class InsufficientCashbackError extends DomainError {
  constructor(uid: string) {
    super(
      `Insufficient cashback balance for ${uid}`,
      'INSUFFICIENT_CASHBACK',
      409,
    )
  }
}

export { DomainError }
