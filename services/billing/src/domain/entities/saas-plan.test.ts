import { describe, expect, it } from 'vitest'
import { SaasPlan } from './saas-plan'

describe('SaasPlan', () => {
  it('exposes all props via getters', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const plan = SaasPlan.create({
      id: 'saas-plan-1',
      name: 'Pro',
      priceCents: 9900,
      active: true,
      createdAt,
    })

    expect(plan.id).toBe('saas-plan-1')
    expect(plan.name).toBe('Pro')
    expect(plan.priceCents).toBe(9900)
    expect(plan.active).toBe(true)
    expect(plan.createdAt).toBe(createdAt)
  })
})
