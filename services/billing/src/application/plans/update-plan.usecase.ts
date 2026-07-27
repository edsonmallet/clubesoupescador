import type { SaasPlan } from '../../domain/entities/saas-plan'
import { PlanNotFoundError } from '../../domain/errors'
import type {
  ISaasPlanRepository,
  UpdateSaasPlanDto,
} from '../../domain/interfaces/ISaasPlanRepository'

export type UpdatePlanInput = {
  id: string
} & UpdateSaasPlanDto

export class UpdatePlanUseCase {
  constructor(private readonly saasPlanRepository: ISaasPlanRepository) {}

  async execute(input: UpdatePlanInput): Promise<SaasPlan> {
    const { id, ...data } = input
    const existing = await this.saasPlanRepository.findById(id)
    if (!existing) throw new PlanNotFoundError(id)

    return this.saasPlanRepository.update(id, data)
  }
}
