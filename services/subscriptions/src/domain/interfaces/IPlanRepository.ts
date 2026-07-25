import type { Plan } from '../entities/plan'

export interface IPlanRepository {
  findActiveByTenant(tenantId: string): Promise<Plan[]>
  findById(id: string): Promise<Plan | null>
}
