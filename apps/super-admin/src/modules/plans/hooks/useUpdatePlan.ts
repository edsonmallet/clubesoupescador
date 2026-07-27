'use client'

import { zodResolver } from '@/shared/utils/zod-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { type PlanInput, planSchema } from '../schemas/plan.schema'
import { plansService } from '../services/plans.service'
import type { SaasPlan } from '../types/plan'

export function useUpdatePlan(
  plan: SaasPlan | undefined,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient()
  const form = useForm<PlanInput>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name ?? '',
      priceCents: plan?.priceCents ?? 0,
      active: plan?.active ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PlanInput) => {
      if (!plan) throw new Error('Nenhum plano selecionado para edição')
      return plansService.update(plan.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      onSuccess?.()
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
