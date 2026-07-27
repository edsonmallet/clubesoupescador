import { z } from 'zod'

export const createTenantSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug deve ter no mínimo 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
  name: z.string().min(2, 'Informe o nome da loja'),
  ownerUid: z.string().min(1, 'Informe o uid do dono'),
  logoUrl: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>
