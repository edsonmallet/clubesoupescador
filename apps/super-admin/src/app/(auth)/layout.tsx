'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { SuperAdminLayout } from '@/shared/components/SuperAdminLayout'
import { useAuthStore } from '@/shared/store/auth.store'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const uid = useAuthStore((state) => state.uid)
  const role = useAuthStore((state) => state.role)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    if (isLoading) return

    if (!uid || role !== 'super_admin') {
      router.replace('/entrar')
    }
  }, [uid, role, isLoading, router])

  if (isLoading || !uid || role !== 'super_admin') {
    return null
  }

  return <SuperAdminLayout>{children}</SuperAdminLayout>
}
