import { z } from 'zod'

export const checkoutSchema = z.object({
  name: z.string().min(1, 'Informe o nome do responsável'),
  cpfCnpj: z.string().min(11, 'Informe um CPF ou CNPJ válido'),
})

export type CheckoutFormInput = z.infer<typeof checkoutSchema>
