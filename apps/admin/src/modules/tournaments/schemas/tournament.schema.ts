import { z } from 'zod'

export const tournamentSchema = z.object({
  title: z.string().min(1, 'Informe o título'),
  description: z.string().min(1, 'Informe a descrição'),
})

export type TournamentFormInput = z.infer<typeof tournamentSchema>
