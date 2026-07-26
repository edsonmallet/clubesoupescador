'use client'

import { zodResolver } from '@/shared/utils/zod-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import type { OfferFormInput } from '../schemas/offer.schema'
import { offerSchema } from '../schemas/offer.schema'
import { offersService } from '../services/offers.service'

export function useCreateOffer() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const form = useForm<OfferFormInput>({
    resolver: zodResolver(offerSchema),
    defaultValues: { images: [] },
  })

  const mutation = useMutation({
    mutationFn: (data: OfferFormInput) => offersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] })
      router.push('/ofertas')
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
