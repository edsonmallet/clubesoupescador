'use client'

import { getFirebaseAuth } from '@/shared/services/firebase'
import { useAuthStore } from '@/shared/store/auth.store'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function useLogout() {
  const router = useRouter()
  const clear = useAuthStore((state) => state.clear)
  const [isPending, setIsPending] = useState(false)

  async function logout() {
    setIsPending(true)
    await signOut(getFirebaseAuth())
    clear()
    router.replace('/entrar')
  }

  return { logout, isPending }
}
