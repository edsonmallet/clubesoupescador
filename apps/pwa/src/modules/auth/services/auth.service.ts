import { apiClient } from '@/shared/services/api-client'
import type { MeResponse, RegisterUserResponse } from '@clube/shared-types'

export const authService = {
  register: () => apiClient.post<RegisterUserResponse>('/v1/auth/register'),
  me: () => apiClient.get<MeResponse>('/v1/auth/me'),
}
