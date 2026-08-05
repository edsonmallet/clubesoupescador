// Mock-only: não existe perfil de membro (nível/XP/estatísticas) em
// packages/shared-types hoje — só uid/role/tenantId via Firebase. TODO:
// substituir por contrato real quando o backend expuser isso.
export type ProfileStats = {
  levelName: string
  currentXp: number
  nextLevelXp: number
  ordersCount: number
  rafflesCount: number
  memberSince: string
}

const MOCK_PROFILE_STATS: ProfileStats = {
  levelName: 'Pescador Prata',
  currentXp: 420,
  nextLevelXp: 600,
  ordersCount: 7,
  rafflesCount: 3,
  memberSince: '2024-02-14T12:00:00.000Z',
}

const delay = <T>(value: T) => Promise.resolve(value)

export const profileService = {
  getStats: () => delay<ProfileStats>(MOCK_PROFILE_STATS),
}
