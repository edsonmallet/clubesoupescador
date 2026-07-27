import { apiClient } from '@/shared/services/api-client'
import type { PlanInput } from '../schemas/plan.schema'
import type { SaasPlan } from '../types/plan'

export const plansService = {
  list: () => apiClient.get<SaasPlan[]>('/v1/billing/plans/all'),
  create: (data: PlanInput) =>
    apiClient.post<SaasPlan>('/v1/billing/plans', data),
  update: (id: string, data: Partial<PlanInput>) =>
    apiClient.patch<SaasPlan>(`/v1/billing/plans/${id}`, data),
}
