import { z } from 'zod'

export const createTopicSchema = z.object({
  categoryId: z.string().min(1, 'Escolha uma categoria'),
  title: z.string().min(1, 'Informe o título'),
  body: z.string().min(1, 'Escreva o conteúdo'),
})

export type CreateTopicFormInput = z.infer<typeof createTopicSchema>
