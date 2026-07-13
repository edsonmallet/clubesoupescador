import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'

describe('DomainError', () => {
  it('exposes code and statusCode', () => {
    const error = new DomainError('Plan not found', 'PLAN_NOT_FOUND', 404)

    expect(error.message).toBe('Plan not found')
    expect(error.code).toBe('PLAN_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(Error)
  })
})
