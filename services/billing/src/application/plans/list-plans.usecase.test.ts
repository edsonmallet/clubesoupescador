import { describe, expect, it, vi } from 'vitest'
import { SaasPlan } from '../../domain/entities/saas-plan'
import { ListPlansUseCase } from './list-plans.usecase'

function makePlan(
  overrides: Partial<Parameters<typeof SaasPlan.create>[0]> = {},
) {
  return SaasPlan.create({
    id: 'plan-1',
    name: 'Starter',
    priceCents: 9900,
    active: true,
    createdAt: new Date(),
    ...overrides,
  })
}

describe('ListPlansUseCase', () => {
  it('returns only active plans', async () => {
    const saasPlanRepository = {
      list: vi
        .fn()
        .mockResolvedValue([
          makePlan({ id: 'plan-1', active: true }),
          makePlan({ id: 'plan-2', active: false }),
        ]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }

    const usecase = new ListPlansUseCase(saasPlanRepository)
    const result = await usecase.execute()

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('plan-1')
  })
})
