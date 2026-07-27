import type { Role } from '@clube/shared-types'
import { create } from 'zustand'

type AuthState = {
  uid: string | null
  role: Role | null
  isLoading: boolean
  setUser: (user: { uid: string; role: Role }) => void
  clear: () => void
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  role: null,
  isLoading: true,
  setUser: ({ uid, role }) => set({ uid, role, isLoading: false }),
  clear: () => set({ uid: null, role: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}))
