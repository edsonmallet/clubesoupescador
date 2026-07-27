'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/shared/utils/zod-resolver'
import { type RaffleFormInput, raffleSchema } from '../schemas/raffle.schema'
import { rafflesService } from '../services/raffles.service'

export function useCreateRaffle() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const form = useForm<RaffleFormInput>({
    resolver: zodResolver(raffleSchema),
    defaultValues: { imageUrl: null, maxTickets: null, drawDate: null, lotteryGame: 'federal' },
  })

  const mutation = useMutation({
    mutationFn: (data: RaffleFormInput) => rafflesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-raffles'] })
      router.push('/rifas')
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
