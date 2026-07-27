'use client'

import { Button, Input } from '@clube/ui'
import { useCreatePlan } from '../hooks/useCreatePlan'
import { useUpdatePlan } from '../hooks/useUpdatePlan'
import type { SaasPlan } from '../types/plan'

type PlanFormProps = {
  plan?: SaasPlan
  onSuccess?: () => void
}

export function PlanForm({ plan, onSuccess }: PlanFormProps) {
  const isEditing = Boolean(plan)
  const createHook = useCreatePlan(onSuccess)
  const updateHook = useUpdatePlan(plan, onSuccess)
  const { form, mutation, onSubmit } = isEditing ? updateHook : createHook

  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nome do plano
        </label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <span className="text-sm text-red-600">{errors.name.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="priceCents" className="text-sm font-medium">
          Preço (em centavos)
        </label>
        <Input id="priceCents" type="number" {...register('priceCents')} />
        {errors.priceCents && (
          <span className="text-sm text-red-600">
            {errors.priceCents.message}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          type="checkbox"
          className="h-4 w-4"
          {...register('active')}
        />
        <label htmlFor="active" className="text-sm font-medium">
          Ativo
        </label>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">Não foi possível salvar o plano.</p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending
          ? 'Salvando...'
          : isEditing
            ? 'Salvar alterações'
            : 'Criar plano'}
      </Button>
    </form>
  )
}
