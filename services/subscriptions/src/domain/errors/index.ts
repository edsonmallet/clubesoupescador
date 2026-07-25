import { DomainError } from './domain-error'

export class SubscriptionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Subscription ${id} not found`, 'SUBSCRIPTION_NOT_FOUND', 404)
  }
}

export class PlanNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Plan ${id} not found`, 'PLAN_NOT_FOUND', 404)
  }
}

export class SubscriptionAlreadyActiveError extends DomainError {
  constructor(uid: string) {
    super(
      `Subscription for ${uid} is already active`,
      'SUBSCRIPTION_ALREADY_ACTIVE',
      409,
    )
  }
}
