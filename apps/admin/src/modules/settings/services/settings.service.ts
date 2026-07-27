import type {
  CashbackConfigItem,
  Level,
  UpdateLevelInput,
  XpConfigItem,
} from '@clube/shared-types'
import { apiClient } from '@/shared/services/api-client'

export const settingsService = {
  listXpConfig: () => apiClient.get<XpConfigItem[]>('/v1/admin/xp-config'),
  updateXpConfig: (data: XpConfigItem) =>
    apiClient.patch<XpConfigItem>('/v1/admin/xp-config', data),

  listCashbackConfig: () => apiClient.get<CashbackConfigItem[]>('/v1/admin/cashback-config'),
  updateCashbackConfig: (data: CashbackConfigItem) =>
    apiClient.patch<CashbackConfigItem>('/v1/admin/cashback-config', data),

  listLevels: () => apiClient.get<Level[]>('/v1/admin/levels'),
  updateLevel: (id: string, data: UpdateLevelInput) =>
    apiClient.patch<Level>(`/v1/admin/levels/${id}`, data),
}
