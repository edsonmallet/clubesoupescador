'use client'

import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { MetricCard } from './MetricCard'
import { SignupsChart } from './SignupsChart'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function DashboardOverview() {
  const { subscriptions, store, cashback, isLoading } = useDashboardSummary()

  if (isLoading) return <p>Carregando...</p>

  const monthlyRevenueCents =
    (subscriptions.data?.monthlyRevenueCents ?? 0) + (store.data?.revenueCentsThisMonth ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Membros ativos"
          value={String(subscriptions.data?.activeMembers ?? 0)}
        />
        <MetricCard label="Receita do mês" value={formatPrice(monthlyRevenueCents)} />
        <MetricCard
          label="Pedidos pendentes de despacho"
          value={String(store.data?.pendingOrders ?? 0)}
        />
        <MetricCard
          label="Cashback total gerado"
          value={formatPrice(cashback.data?.totalGrantedCents ?? 0)}
        />
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-4 text-sm font-medium text-slate-600">
          Novos membros (últimos 30 dias)
        </h2>
        <SignupsChart data={subscriptions.data?.signupsByDay ?? []} />
      </div>
    </div>
  )
}
