'use client'

import { getFirebaseAuth } from '@/shared/services/firebase'
import type { CreateCheckoutInput } from '@clube/shared-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getMessaging, onMessage } from 'firebase/messaging'
import { useEffect } from 'react'
import { subscriptionsService } from '../services/subscriptions.service'

function listenForSubscriptionConfirmation(onConfirmed: () => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator))
    return undefined

  try {
    const messaging = getMessaging()
    return onMessage(messaging, () => onConfirmed())
  } catch {
    return undefined
  }
}

export function useCheckout() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribe = listenForSubscriptionConfirmation(() => {
      void (async () => {
        await getFirebaseAuth().currentUser?.getIdToken(true)
        queryClient.invalidateQueries({ queryKey: ['my-subscription'] })
      })()
    })

    return unsubscribe
  }, [queryClient])

  return useMutation({
    mutationFn: (data: CreateCheckoutInput) =>
      subscriptionsService.createCheckout(data),
    onSuccess: (response) => {
      if (response.paymentUrl) {
        window.open(response.paymentUrl, '_blank')
      }
    },
  })
}
