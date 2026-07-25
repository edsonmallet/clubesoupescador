import { describe, expect, it } from 'vitest'
import { Plan } from './Plan'

describe('Plan', () => {
  it('exposes all props via getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const plan = Plan.create({
      id: 'plan-1',
      tenantId: 'tenant-1',
      name: 'Assinatura Mensal',
      priceCents: 1990,
      active: true,
      createdAt,
    })

    expect(plan.id).toBe('plan-1')
    expect(plan.tenantId).toBe('tenant-1')
    expect(plan.name).toBe('Assinatura Mensal')
    expect(plan.priceCents).toBe(1990)
    expect(plan.active).toBe(true)
    expect(plan.createdAt).toBe(createdAt)
  })
})
