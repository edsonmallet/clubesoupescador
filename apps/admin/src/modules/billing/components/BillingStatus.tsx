'use client'

import { useMyBilling } from '../hooks/useMyBilling'
import { usePlans } from '../hooks/usePlans'
import type { TenantBillingStatus } from '../types/billing'

const STATUS_LABELS: Record<TenantBillingStatus, string> = {
  inactive: 'Inativo',
  active: 'Ativo',
  overdue: 'Inadimplente',
  cancelled: 'Cancelado',
}

const STATUS_CLASSNAMES: Record<TenantBillingStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
  inactive: 'bg-slate-100 text-slate-600',
}

export function BillingStatus() {
  const { data: billing, isLoading, isError } = useMyBilling()
  const { data: plans } = usePlans()

  if (isLoading) return <p>Carregando assinatura...</p>
  if (isError) return <p>Erro ao carregar sua assinatura.</p>

  if (!billing) {
    return (
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-500">
          Assinatura da plataforma
        </p>
        <p className="mt-1 text-lg font-semibold">
          Você ainda não assinou nenhum plano
        </p>
      </div>
    )
  }

  const planName =
    plans?.find((plan) => plan.id === billing.planId)?.name ?? billing.planId

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-500">
        Assinatura da plataforma
      </p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg font-semibold">{planName}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSNAMES[billing.status]}`}
        >
          {STATUS_LABELS[billing.status]}
        </span>
      </div>
    </div>
  )
}
