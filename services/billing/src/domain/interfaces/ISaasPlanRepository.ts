import type { SaasPlan } from '../entities/saas-plan'

export type CreateSaasPlanDto = {
  name: string
  priceCents: number
  active: boolean
}

export type UpdateSaasPlanDto = {
  name?: string
  priceCents?: number
  active?: boolean
}

export interface ISaasPlanRepository {
  list(): Promise<SaasPlan[]>
  findById(id: string): Promise<SaasPlan | null>
  create(data: CreateSaasPlanDto): Promise<SaasPlan>
  update(id: string, data: UpdateSaasPlanDto): Promise<SaasPlan>
}
