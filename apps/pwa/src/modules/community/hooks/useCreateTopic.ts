'use client'

import { zodResolver } from '@/shared/utils/zod-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import {
  type CreateTopicFormInput,
  createTopicSchema,
} from '../schemas/topic.schema'
import { communityService } from '../services/community.service'

export function useCreateTopic() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const form = useForm<CreateTopicFormInput>({
    resolver: zodResolver(createTopicSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: CreateTopicFormInput) =>
      communityService.createTopic(data),
    onSuccess: (topic) => {
      queryClient.invalidateQueries({ queryKey: ['community-topics'] })
      router.push(`/comunidade/topico/${topic.id}`)
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
