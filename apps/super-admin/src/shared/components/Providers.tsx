'use client'

import { getFirebaseAuth } from '@/shared/services/firebase'
import { useAuthStore } from '@/shared/store/auth.store'
import type { Role } from '@clube/shared-types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { onAuthStateChanged } from 'firebase/auth'
import { type ReactNode, useEffect, useState } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const setUser = useAuthStore((state) => state.setUser)
  const clear = useAuthStore((state) => state.clear)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      getFirebaseAuth(),
      async (firebaseUser) => {
        if (!firebaseUser) {
          clear()
          return
        }

        setLoading(true)
        const idTokenResult = await firebaseUser.getIdTokenResult()
        const role = (idTokenResult.claims.role as Role | undefined) ?? 'user'
        setUser({ uid: firebaseUser.uid, role })
      },
    )

    return unsubscribe
  }, [setUser, clear, setLoading])

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
