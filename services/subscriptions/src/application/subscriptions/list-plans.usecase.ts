import type { Plan } from '../../domain/entities/plan'
import type { IPlanRepository } from '../../domain/interfaces/IPlanRepository'

export type ListPlansInput = {
  tenantId: string
}

export class ListPlansUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(input: ListPlansInput): Promise<Plan[]> {
    return this.planRepository.findActiveByTenant(input.tenantId)
  }
}
