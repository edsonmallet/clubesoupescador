import type { MeResponse } from '@clube/shared-types'
import { apiClient } from '@/shared/services/api-client'

export const authService = {
  me: () => apiClient.get<MeResponse>('/v1/auth/me'),
}
