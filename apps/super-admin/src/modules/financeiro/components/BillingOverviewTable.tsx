'use client'

import { formatMoney } from '@/shared/utils/format-money'
import { useBillingOverview } from '../hooks/useBillingOverview'
import type { TenantBillingStatus } from '../types/billing-overview'

const STATUS_LABELS: Record<TenantBillingStatus, string> = {
  inactive: 'Inativo',
  active: 'Ativo',
  overdue: 'Inadimplente',
  cancelled: 'Cancelado',
}

export function BillingOverviewTable() {
  const { data, isLoading, isError } = useBillingOverview()

  if (isLoading) return <p>Carregando lojistas...</p>
  if (isError) return <p>Erro ao carregar lojistas.</p>

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="py-2">Loja</th>
          <th className="py-2">Plano</th>
          <th className="py-2">Preço</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {(data?.items ?? []).map((item) => (
          <tr key={item.tenantId} className="border-b border-slate-100">
            <td className="py-2">{item.tenantId}</td>
            <td className="py-2">{item.planName}</td>
            <td className="py-2">{formatMoney(item.priceCents)}</td>
            <td className="py-2">
              <span
                className={
                  item.status === 'overdue'
                    ? 'rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700'
                    : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'
                }
              >
                {STATUS_LABELS[item.status]}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
