import { z } from 'zod'

export const offerSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  description: z.string().min(1, 'Informe a descrição'),
  priceFullCents: z.number().min(0),
  priceClubCents: z.number().min(0),
  stock: z.number().min(0),
  sku: z.string().min(1, 'Informe o SKU'),
  images: z.array(z.string().url('URL de imagem inválida')),
})

export type OfferFormInput = z.infer<typeof offerSchema>
