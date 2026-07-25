import { describe, expect, it, vi } from 'vitest'
import { Plan } from '../../domain/entities/plan'
import { ListPlansUseCase } from './list-plans.usecase'

describe('ListPlansUseCase', () => {
  it('returns active plans for the given tenant', async () => {
    const plan = Plan.create({
      id: 'plan-1',
      tenantId: 'tenant-1',
      name: 'Assinatura Mensal',
      priceCents: 1990,
      active: true,
      createdAt: new Date(),
    })
    const planRepository = {
      findActiveByTenant: vi.fn().mockResolvedValue([plan]),
      findById: vi.fn(),
    }

    const usecase = new ListPlansUseCase(planRepository)
    const result = await usecase.execute({ tenantId: 'tenant-1' })

    expect(planRepository.findActiveByTenant).toHaveBeenCalledWith('tenant-1')
    expect(result).toEqual([plan])
  })
})
