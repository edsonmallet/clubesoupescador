import { apiClient } from '@/shared/services/api-client'
import type { CreateTenantInput } from '../schemas/tenant.schema'
import type { SuperTenant, TenantWithMemberCount } from '../types/tenant'

export const tenantsService = {
  list: () => apiClient.get<TenantWithMemberCount[]>('/v1/super/tenants'),
  getById: (id: string) => apiClient.get<TenantWithMemberCount>(`/v1/super/tenants/${id}`),
  create: (data: CreateTenantInput) =>
    apiClient.post<SuperTenant>('/v1/super/tenants', {
      ...data,
      logoUrl: data.logoUrl || undefined,
    }),
  updateStatus: (id: string, status: 'active' | 'suspended') =>
    apiClient.patch<SuperTenant>(`/v1/super/tenants/${id}/status`, { status }),
  impersonate: (id: string) =>
    apiClient.post<{ token: string; ownerUid: string; slug: string }>(
      `/v1/super/tenants/${id}/impersonate`,
    ),
}
