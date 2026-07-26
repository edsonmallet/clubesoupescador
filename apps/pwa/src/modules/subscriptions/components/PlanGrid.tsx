'use client'

import { usePlans } from '../hooks/usePlans'
import { PlanCard } from './PlanCard'

export function PlanGrid() {
  const { data: plans, isLoading } = usePlans()

  if (isLoading) return <p>Carregando planos...</p>

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plans?.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  )
}
