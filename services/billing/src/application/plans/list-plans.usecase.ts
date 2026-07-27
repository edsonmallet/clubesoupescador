import type { SaasPlan } from '../../domain/entities/saas-plan'
import type { ISaasPlanRepository } from '../../domain/interfaces/ISaasPlanRepository'

export class ListPlansUseCase {
  constructor(private readonly saasPlanRepository: ISaasPlanRepository) {}

  async execute(): Promise<SaasPlan[]> {
    const plans = await this.saasPlanRepository.list()
    return plans.filter((plan) => plan.active)
  }
}
