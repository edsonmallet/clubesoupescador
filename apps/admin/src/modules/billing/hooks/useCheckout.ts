'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { billingService } from '../services/billing.service'
import type { CheckoutInput } from '../types/billing'

/**
 * On success, redirects to the Asaas payment link when present. `paymentUrl`
 * can be `null` (see services/billing's create-checkout usecase — the
 * payment-lookup call to Asaas can fail after the customer/subscription was
 * already created), in which case the caller must surface an error instead
 * of leaving the user on a page with no explanation.
 */
export function useCheckout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CheckoutInput) => billingService.checkout(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-billing'] })

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      }
    },
  })
}
