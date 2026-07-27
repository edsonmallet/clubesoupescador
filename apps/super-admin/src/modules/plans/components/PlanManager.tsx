'use client'

import { Button } from '@clube/ui'
import { useState } from 'react'
import type { SaasPlan } from '../types/plan'
import { PlanForm } from './PlanForm'
import { PlanTable } from './PlanTable'

export function PlanManager() {
  const [editingPlan, setEditingPlan] = useState<SaasPlan | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const isFormOpen = isCreating || editingPlan !== null

  function closeForm() {
    setIsCreating(false)
    setEditingPlan(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planos SaaS</h1>
        <Button onClick={() => setIsCreating(true)}>Novo plano</Button>
      </div>

      {isFormOpen && (
        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="mb-4 text-lg font-semibold">
            {editingPlan ? 'Editar plano' : 'Novo plano'}
          </h2>
          <PlanForm
            key={editingPlan?.id ?? 'create'}
            plan={editingPlan ?? undefined}
            onSuccess={closeForm}
          />
        </div>
      )}

      <PlanTable onEdit={setEditingPlan} />
    </div>
  )
}
