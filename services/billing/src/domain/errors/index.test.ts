import { describe, expect, it } from 'vitest'
import { PlanNotFoundError, TenantBillingAlreadyActiveError } from './index'

describe('billing domain errors', () => {
  it('PlanNotFoundError carries a 404 and the plan id', () => {
    const error = new PlanNotFoundError('saas-plan-1')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('PLAN_NOT_FOUND')
    expect(error.message).toContain('saas-plan-1')
  })

  it('TenantBillingAlreadyActiveError carries a 409 and the tenant id', () => {
    const error = new TenantBillingAlreadyActiveError('tenant-1')
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('TENANT_BILLING_ALREADY_ACTIVE')
    expect(error.message).toContain('tenant-1')
  })
})
