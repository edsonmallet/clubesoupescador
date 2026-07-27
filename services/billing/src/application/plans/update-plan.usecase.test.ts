import { describe, expect, it, vi } from 'vitest'
import { SaasPlan } from '../../domain/entities/saas-plan'
import { PlanNotFoundError } from '../../domain/errors'
import { UpdatePlanUseCase } from './update-plan.usecase'

function makePlan(overrides: Partial<Parameters<typeof SaasPlan.create>[0]> = {}) {
  return SaasPlan.create({
    id: 'plan-1',
    name: 'Starter',
    priceCents: 9900,
    active: true,
    createdAt: new Date(),
    ...overrides,
  })
}

describe('UpdatePlanUseCase', () => {
  it('throws PlanNotFoundError when the plan does not exist', async () => {
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    }

    const usecase = new UpdatePlanUseCase(saasPlanRepository)

    await expect(
      usecase.execute({ id: 'plan-1', name: 'New Name' }),
    ).rejects.toThrow(PlanNotFoundError)
    expect(saasPlanRepository.update).not.toHaveBeenCalled()
  })

  it('updates an existing plan', async () => {
    const updated = makePlan({ name: 'Updated' })
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(makePlan()),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(updated),
    }

    const usecase = new UpdatePlanUseCase(saasPlanRepository)
    const result = await usecase.execute({ id: 'plan-1', name: 'Updated' })

    expect(saasPlanRepository.update).toHaveBeenCalledWith('plan-1', {
      name: 'Updated',
    })
    expect(result).toBe(updated)
  })
})
