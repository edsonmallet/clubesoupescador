'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { AdminLayout } from '@/shared/components/AdminLayout'
import { useAuthStore } from '@/shared/store/auth.store'

const ALLOWED_ROLES = new Set(['store_owner', 'store_manager', 'super_admin'])

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const uid = useAuthStore((state) => state.uid)
  const role = useAuthStore((state) => state.role)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    if (isLoading) return

    if (!uid) {
      router.replace('/entrar')
      return
    }

    if (!role || !ALLOWED_ROLES.has(role)) {
      router.replace('/entrar')
    }
  }, [uid, role, isLoading, router])

  if (isLoading || !uid || !role || !ALLOWED_ROLES.has(role)) {
    return null
  }

  return <AdminLayout>{children}</AdminLayout>
}
