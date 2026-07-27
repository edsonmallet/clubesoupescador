import { describe, expect, it, vi } from 'vitest'
import { SaasPlan } from '../../domain/entities/saas-plan'
import { CreatePlanUseCase } from './create-plan.usecase'

describe('CreatePlanUseCase', () => {
  it('creates a plan through the repository', async () => {
    const created = SaasPlan.create({
      id: 'plan-1',
      name: 'Starter',
      priceCents: 9900,
      active: true,
      createdAt: new Date(),
    })
    const saasPlanRepository = {
      list: vi.fn(),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(created),
      update: vi.fn(),
    }

    const usecase = new CreatePlanUseCase(saasPlanRepository)
    const result = await usecase.execute({
      name: 'Starter',
      priceCents: 9900,
      active: true,
    })

    expect(saasPlanRepository.create).toHaveBeenCalledWith({
      name: 'Starter',
      priceCents: 9900,
      active: true,
    })
    expect(result).toBe(created)
  })
})
