'use client'

import { zodResolver } from '@/shared/utils/zod-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { type CreateTenantInput, createTenantSchema } from '../schemas/tenant.schema'
import { tenantsService } from '../services/tenants.service'

export function useCreateTenant() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const form = useForm<CreateTenantInput>({ resolver: zodResolver(createTenantSchema) })

  const mutation = useMutation({
    mutationFn: (data: CreateTenantInput) => tenantsService.create(data),
    onSuccess: (tenant) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      router.push(`/lojistas/${tenant.id}`)
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
