import type { SaasPlan } from '../../domain/entities/saas-plan'
import type { ISaasPlanRepository } from '../../domain/interfaces/ISaasPlanRepository'

export type ListPlansOptions = {
  includeInactive?: boolean
}

export class ListPlansUseCase {
  constructor(private readonly saasPlanRepository: ISaasPlanRepository) {}

  async execute(options: ListPlansOptions = {}): Promise<SaasPlan[]> {
    const plans = await this.saasPlanRepository.list()
    if (options.includeInactive) return plans
    return plans.filter((plan) => plan.active)
  }
}
