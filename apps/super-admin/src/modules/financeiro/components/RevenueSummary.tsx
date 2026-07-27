'use client'

import { formatMoney } from '@/shared/utils/format-money'
import { useBillingOverview } from '../hooks/useBillingOverview'

export function RevenueSummary() {
  const { data, isLoading, isError } = useBillingOverview()

  if (isLoading) return <p>Carregando resumo financeiro...</p>
  if (isError) return <p>Erro ao carregar resumo financeiro.</p>
  if (!data) return null

  const hasOverdue = data.overdueCount > 0

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-500">MRR</p>
        <p className="text-2xl font-bold">{formatMoney(data.mrrCents)}</p>
      </div>
      <div
        className={
          hasOverdue
            ? 'rounded-lg border border-red-300 bg-red-50 p-4'
            : 'rounded-lg border border-slate-200 p-4'
        }
      >
        <p className="text-sm font-medium text-slate-500">
          Lojistas inadimplentes
        </p>
        <p
          className={
            hasOverdue
              ? 'text-2xl font-bold text-red-600'
              : 'text-2xl font-bold'
          }
        >
          {data.overdueCount}
        </p>
      </div>
    </div>
  )
}
