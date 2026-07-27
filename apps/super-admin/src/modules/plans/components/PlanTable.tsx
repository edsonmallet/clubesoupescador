'use client'

import { formatMoney } from '@/shared/utils/format-money'
import { usePlans } from '../hooks/usePlans'
import type { SaasPlan } from '../types/plan'

type PlanTableProps = {
  onEdit: (plan: SaasPlan) => void
}

export function PlanTable({ onEdit }: PlanTableProps) {
  const { data, isLoading, isError } = usePlans()

  if (isLoading) return <p>Carregando planos...</p>
  if (isError) return <p>Erro ao carregar planos.</p>

  if ((data ?? []).length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Nenhum plano cadastrado ainda. Use o botão &quot;Novo plano&quot;
        acima para criar o primeiro plano SaaS.
      </p>
    )
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="py-2">Nome</th>
          <th className="py-2">Preço</th>
          <th className="py-2">Status</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map((plan) => (
          <tr key={plan.id} className="border-b border-slate-100">
            <td className="py-2">{plan.name}</td>
            <td className="py-2">{formatMoney(plan.priceCents)}</td>
            <td className="py-2">
              <span
                className={
                  plan.active
                    ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'
                    : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'
                }
              >
                {plan.active ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td className="py-2">
              <button
                type="button"
                className="text-sm font-medium text-slate-700 hover:underline"
                onClick={() => onEdit(plan)}
              >
                Editar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
