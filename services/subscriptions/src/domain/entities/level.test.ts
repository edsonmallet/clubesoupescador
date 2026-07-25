import { describe, expect, it } from 'vitest'
import { Level } from './Level'

describe('Level', () => {
  it('exposes all props via getters', () => {
    const level = Level.create({
      id: 'level-1',
      name: 'Bronze',
      minXp: 0,
      storeDiscountPct: 5,
      cashbackPct: 3,
    })

    expect(level.id).toBe('level-1')
    expect(level.name).toBe('Bronze')
    expect(level.minXp).toBe(0)
    expect(level.storeDiscountPct).toBe(5)
    expect(level.cashbackPct).toBe(3)
  })
})
