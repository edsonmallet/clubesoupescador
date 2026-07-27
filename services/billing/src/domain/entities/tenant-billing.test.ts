import { describe, expect, it } from 'vitest'
import { TenantBilling } from './tenant-billing'

describe('TenantBilling', () => {
  it('exposes all props via getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const updatedAt = new Date('2026-01-02T00:00:00Z')
    const tenantBilling = TenantBilling.create({
      id: 'tb-1',
      tenantId: 'tenant-1',
      planId: 'saas-plan-1',
      asaasCustomerId: 'cus_1',
      asaasSubscriptionId: 'asub_1',
      status: 'inactive',
      createdAt,
      updatedAt,
    })

    expect(tenantBilling.id).toBe('tb-1')
    expect(tenantBilling.tenantId).toBe('tenant-1')
    expect(tenantBilling.planId).toBe('saas-plan-1')
    expect(tenantBilling.asaasCustomerId).toBe('cus_1')
    expect(tenantBilling.asaasSubscriptionId).toBe('asub_1')
    expect(tenantBilling.status).toBe('inactive')
    expect(tenantBilling.createdAt).toBe(createdAt)
    expect(tenantBilling.updatedAt).toBe(updatedAt)
  })
})
