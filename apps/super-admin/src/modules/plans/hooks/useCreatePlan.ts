'use client'

import { zodResolver } from '@/shared/utils/zod-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { type PlanInput, planSchema } from '../schemas/plan.schema'
import { plansService } from '../services/plans.service'

export function useCreatePlan(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  const form = useForm<PlanInput>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: '', priceCents: 0, active: true },
  })

  const mutation = useMutation({
    mutationFn: (data: PlanInput) => plansService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      form.reset()
      onSuccess?.()
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
