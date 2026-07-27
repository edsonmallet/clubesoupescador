import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'
import { SlugAlreadyTakenError } from './slug-already-taken.error'

describe('SlugAlreadyTakenError', () => {
  it('carries the right code and status', () => {
    const error = new SlugAlreadyTakenError('acme')

    expect(error.message).toBe('Slug acme is already taken')
    expect(error.code).toBe('SLUG_ALREADY_TAKEN')
    expect(error.statusCode).toBe(409)
    expect(error).toBeInstanceOf(DomainError)
  })
})
