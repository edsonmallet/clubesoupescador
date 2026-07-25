import { describe, expect, it } from 'vitest'
import { Subscription } from './Subscription'

describe('Subscription', () => {
  it('exposes all props via getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const updatedAt = new Date('2026-01-02T00:00:00Z')
    const subscription = Subscription.create({
      id: 'sub-1',
      tenantId: 'tenant-1',
      uid: 'uid-1',
      planId: 'plan-1',
      asaasCustomerId: 'cus_1',
      asaasSubscriptionId: 'asub_1',
      status: 'inactive',
      totalXp: 0,
      levelId: null,
      createdAt,
      updatedAt,
    })

    expect(subscription.id).toBe('sub-1')
    expect(subscription.tenantId).toBe('tenant-1')
    expect(subscription.uid).toBe('uid-1')
    expect(subscription.planId).toBe('plan-1')
    expect(subscription.asaasCustomerId).toBe('cus_1')
    expect(subscription.asaasSubscriptionId).toBe('asub_1')
    expect(subscription.status).toBe('inactive')
    expect(subscription.totalXp).toBe(0)
    expect(subscription.levelId).toBeNull()
    expect(subscription.createdAt).toBe(createdAt)
    expect(subscription.updatedAt).toBe(updatedAt)
  })
})
