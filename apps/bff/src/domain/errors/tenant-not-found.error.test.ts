import { describe, expect, it } from 'vitest'
import { DomainError } from './domain-error'
import { TenantNotFoundError } from './tenant-not-found.error'

describe('TenantNotFoundError', () => {
  it('carries the right code and status', () => {
    const error = new TenantNotFoundError('tenant-1')

    expect(error.message).toBe('Tenant tenant-1 not found')
    expect(error.code).toBe('TENANT_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error).toBeInstanceOf(DomainError)
  })
})
