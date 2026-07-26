import { z } from 'zod'

export const addressSchema = z.object({
  zipCode: z.string().min(8, 'CEP inválido'),
  street: z.string().min(1, 'Informe a rua'),
  number: z.string().min(1, 'Informe o número'),
  complement: z.string().nullable(),
  neighborhood: z.string().min(1, 'Informe o bairro'),
  city: z.string().min(1, 'Informe a cidade'),
  state: z.string().length(2, 'UF inválida'),
})

export type AddressInput = z.infer<typeof addressSchema>

export const buyOfferSchema = z.object({
  qty: z.number().min(1),
  cashbackUseCents: z.number().min(0),
  address: addressSchema,
})

export type BuyOfferFormInput = z.infer<typeof buyOfferSchema>
