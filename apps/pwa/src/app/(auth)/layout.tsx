'use client'

import { useMySubscription } from '@/modules/subscriptions/hooks/useMySubscription'
import { useAuthStore } from '@/shared/store/auth.store'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const uid = useAuthStore((state) => state.uid)
  const isAuthLoading = useAuthStore((state) => state.isLoading)
  const { data: subscription, isLoading: isSubscriptionLoading } =
    useMySubscription({
      enabled: !!uid,
    })

  useEffect(() => {
    if (isAuthLoading) return

    if (!uid) {
      router.replace('/entrar')
      return
    }

    if (!isSubscriptionLoading && subscription?.status !== 'active') {
      router.replace('/planos')
    }
  }, [uid, isAuthLoading, subscription, isSubscriptionLoading, router])

  if (
    isAuthLoading ||
    !uid ||
    isSubscriptionLoading ||
    subscription?.status !== 'active'
  ) {
    return null
  }

  return <>{children}</>
}
