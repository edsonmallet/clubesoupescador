'use client'

import { BillingStatus } from '@/modules/billing/components/BillingStatus'
import { PlanPicker } from '@/modules/billing/components/PlanPicker'
import { useMyBilling } from '@/modules/billing/hooks/useMyBilling'

export default function AssinaturaPage() {
  const { data: billing } = useMyBilling()
  const needsPlan = !billing || billing.status !== 'active'

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Assinatura</h1>

      <div className="flex flex-col gap-6">
        <BillingStatus />
        {needsPlan && (
          <div>
            <h2 className="mb-3 text-lg font-semibold">Escolha um plano</h2>
            <PlanPicker />
          </div>
        )}
      </div>
    </main>
  )
}
