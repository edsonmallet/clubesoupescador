import type { Role } from '@clube/shared-types'
import { create } from 'zustand'

type AuthState = {
  uid: string | null
  role: Role | null
  tenantId: string | null
  isLoading: boolean
  setUser: (user: { uid: string; role: Role; tenantId: string | null }) => void
  clear: () => void
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  role: null,
  tenantId: null,
  isLoading: true,
  setUser: ({ uid, role, tenantId }) => set({ uid, role, tenantId, isLoading: false }),
  clear: () => set({ uid: null, role: null, tenantId: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}))
