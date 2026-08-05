'use client'

// TODO: descomentar import junto com a validação de assinatura ativa abaixo
// import { useMySubscription } from '@/modules/subscriptions/hooks/useMySubscription'
import { BottomNav } from '@/shared/components/BottomNav'
import { useAuthStore } from '@/shared/store/auth.store'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const uid = useAuthStore((state) => state.uid)
  const isAuthLoading = useAuthStore((state) => state.isLoading)
  // TODO: descomentar validação de assinatura ativa quando /v1/subscriptions/me estiver disponível
  // const { data: subscription, isLoading: isSubscriptionLoading } =
  //   useMySubscription({
  //     enabled: !!uid,
  //   })

  useEffect(() => {
    if (isAuthLoading) return

    if (!uid) {
      router.replace('/entrar')
      return
    }

    // TODO: descomentar validação de assinatura ativa quando /v1/subscriptions/me estiver disponível
    // if (!isSubscriptionLoading && subscription?.status !== 'active') {
    //   router.replace('/planos')
    // }
  }, [uid, isAuthLoading, router])

  // TODO: reincluir isSubscriptionLoading e subscription?.status !== 'active' na condição abaixo
  if (isAuthLoading || !uid) {
    return null
  }

  return (
    <>
      <div className="pb-20">{children}</div>
      <BottomNav />
    </>
  )
}
