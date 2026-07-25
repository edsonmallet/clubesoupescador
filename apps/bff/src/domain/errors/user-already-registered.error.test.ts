import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'
import { UserAlreadyRegisteredError } from './user-already-registered.error'

describe('UserAlreadyRegisteredError', () => {
  it('carries the right code and status', () => {
    const error = new UserAlreadyRegisteredError('firebase-uid-1')

    expect(error.message).toBe('User firebase-uid-1 is already registered')
    expect(error.code).toBe('USER_ALREADY_REGISTERED')
    expect(error.statusCode).toBe(409)
    expect(error).toBeInstanceOf(DomainError)
  })
})
