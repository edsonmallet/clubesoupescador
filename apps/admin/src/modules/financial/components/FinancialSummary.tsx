'use client'

import { Button } from '@clube/ui'
import { useDashboardSummary } from '@/modules/dashboard/hooks/useDashboardSummary'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function downloadCsv(rows: Array<[string, string]>) {
  const csv = rows.map(([label, value]) => `"${label}","${value}"`).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `financeiro-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function FinancialSummary() {
  const { subscriptions, store, cashback, isLoading } = useDashboardSummary()

  if (isLoading) return <p>Carregando...</p>

  const rows: Array<[string, string]> = [
    ['Receita de assinaturas (mês)', formatPrice(subscriptions.data?.monthlyRevenueCents ?? 0)],
    ['Receita de vendas (mês)', formatPrice(store.data?.revenueCentsThisMonth ?? 0)],
    ['Cashback gerado (total)', formatPrice(cashback.data?.totalGrantedCents ?? 0)],
    ['Cashback resgatado (total)', formatPrice(cashback.data?.totalRedeemedCents ?? 0)],
  ]

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full max-w-lg border-collapse text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-slate-100">
              <td className="py-2 text-slate-600">{label}</td>
              <td className="py-2 text-right font-semibold">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button variant="outline" className="w-fit" onClick={() => downloadCsv(rows)}>
        Exportar CSV
      </Button>
    </div>
  )
}
