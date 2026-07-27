import { z } from 'zod'

export const raffleSchema = z.object({
  title: z.string().min(1, 'Informe o título'),
  description: z.string().min(1, 'Informe a descrição'),
  prize: z.string().min(1, 'Informe o prêmio'),
  imageUrl: z.string().url().nullable(),
  ticketPriceCents: z.number().min(1),
  maxTickets: z.number().min(1).nullable(),
  drawDate: z.string().nullable(),
  lotteryGame: z.string().min(1),
})

export type RaffleFormInput = z.infer<typeof raffleSchema>
