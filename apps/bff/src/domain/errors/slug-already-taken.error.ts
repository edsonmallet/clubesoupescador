import { DomainError } from './domain-error'

export class SlugAlreadyTakenError extends DomainError {
  constructor(slug: string) {
    super(`Slug ${slug} is already taken`, 'SLUG_ALREADY_TAKEN', 409)
  }
}
