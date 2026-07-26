import { describe, expect, it } from 'vitest'
import { hotScore } from './list-topics.usecase'

describe('hotScore', () => {
  it('computes (voteScore) / (hoursSinceCreation + 2)^1.5', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-01T10:00:00Z') // 10 hours later

    const score = hotScore(20, createdAt, now)

    expect(score).toBeCloseTo(20 / (10 + 2) ** 1.5, 5)
  })

  it('is highest for a brand-new topic with the same score (age ~0h)', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const brandNew = hotScore(10, now, now)
    const oneDayOld = hotScore(
      10,
      new Date(now.getTime() - 24 * 60 * 60 * 1000),
      now,
    )

    expect(brandNew).toBeGreaterThan(oneDayOld)
  })

  it('decays as the topic ages, even with a constant vote score', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const scores = [1, 5, 24, 100].map((hoursAgo) =>
      hotScore(50, new Date(now.getTime() - hoursAgo * 60 * 60 * 1000), now),
    )

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThan(scores[i - 1])
    }
  })

  it('is negative when the net score is negative (more downvotes than upvotes)', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-01T05:00:00Z')

    expect(hotScore(-10, createdAt, now)).toBeLessThan(0)
  })

  it('is 0 when the net vote score is 0, regardless of age', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    expect(hotScore(0, createdAt, new Date('2026-01-02T00:00:00Z'))).toBe(0)
  })

  it('never divides by zero for a topic created this instant', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    // hoursSinceCreation = 0 -> denominator is 2^1.5, never zero.
    expect(Number.isFinite(hotScore(100, now, now))).toBe(true)
  })

  it('a higher score always outranks a lower score at the same age', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-01T03:00:00Z')

    expect(hotScore(100, createdAt, now)).toBeGreaterThan(
      hotScore(10, createdAt, now),
    )
  })
})
