import type { SaasPlan } from '../../domain/entities/saas-plan'
import type { ISaasPlanRepository } from '../../domain/interfaces/ISaasPlanRepository'

export type CreatePlanInput = {
  name: string
  priceCents: number
  active: boolean
}

export class CreatePlanUseCase {
  constructor(private readonly saasPlanRepository: ISaasPlanRepository) {}

  async execute(input: CreatePlanInput): Promise<SaasPlan> {
    return this.saasPlanRepository.create({
      name: input.name,
      priceCents: input.priceCents,
      active: input.active,
    })
  }
}
