import { DomainError } from './domain-error'

export class TopicNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Topic ${id} not found`, 'TOPIC_NOT_FOUND', 404)
  }
}

export class CategoryNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Category ${id} not found`, 'CATEGORY_NOT_FOUND', 404)
  }
}

export class TopicLockedError extends DomainError {
  constructor(id: string) {
    super(`Topic ${id} is locked`, 'TOPIC_LOCKED', 409)
  }
}

export class MaxThreadingDepthError extends DomainError {
  constructor() {
    super(
      'Comments can only be nested 2 levels deep',
      'MAX_THREADING_DEPTH',
      409,
    )
  }
}

export class CommentNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Comment ${id} not found`, 'COMMENT_NOT_FOUND', 404)
  }
}

export { DomainError }
