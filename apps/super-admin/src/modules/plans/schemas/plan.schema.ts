import { z } from 'zod'

export const planSchema = z.object({
  name: z.string().min(2, 'Informe o nome do plano'),
  priceCents: z.coerce
    .number()
    .int('Use um valor inteiro, em centavos')
    .positive('Informe um preço maior que zero'),
  active: z.boolean(),
})

export type PlanInput = z.infer<typeof planSchema>
