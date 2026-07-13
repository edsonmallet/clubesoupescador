import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'

describe('DomainError', () => {
  it('exposes code and statusCode', () => {
    const error = new DomainError(
      'Ledger entry not found',
      'LEDGER_ENTRY_NOT_FOUND',
      404,
    )

    expect(error.message).toBe('Ledger entry not found')
    expect(error.code).toBe('LEDGER_ENTRY_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(Error)
  })
})
