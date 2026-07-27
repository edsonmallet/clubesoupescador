import { apiClient } from '@/shared/services/api-client'
import type {
  Domain,
  LandingConfig,
  UpdateLandingConfigInput,
} from '@clube/shared-types'

export const landingService = {
  getConfig: () => apiClient.get<LandingConfig>('/v1/admin/landing-config'),
  updateConfig: (data: UpdateLandingConfigInput) =>
    apiClient.patch<LandingConfig>('/v1/admin/landing-config', data),
  listDomains: () => apiClient.get<Domain[]>('/v1/admin/domains'),
  addDomain: (domain: string) =>
    apiClient.post<Domain>('/v1/admin/domains', { domain }),
  verifyDomain: (id: string) =>
    apiClient.post<Domain>(`/v1/admin/domains/${id}/verify`),
}
