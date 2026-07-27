'use client'

import { zodResolver } from '@/shared/utils/zod-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import {
  type TournamentFormInput,
  tournamentSchema,
} from '../schemas/tournament.schema'
import { tournamentsService } from '../services/tournaments.service'

export function useCreateTournament() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const form = useForm<TournamentFormInput>({
    resolver: zodResolver(tournamentSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: TournamentFormInput) => tournamentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] })
      router.push('/torneios')
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
