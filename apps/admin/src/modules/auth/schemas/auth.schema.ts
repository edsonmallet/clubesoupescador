import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export type SignInInput = z.infer<typeof signInSchema>
