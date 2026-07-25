import { DomainError } from './domain-error'

export class UserAlreadyRegisteredError extends DomainError {
  constructor(uid: string) {
    super(`User ${uid} is already registered`, 'USER_ALREADY_REGISTERED', 409)
  }
}
