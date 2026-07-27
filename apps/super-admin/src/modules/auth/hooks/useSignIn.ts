'use client'

import { useMutation } from '@tanstack/react-query'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { getFirebaseAuth } from '@/shared/services/firebase'
import { zodResolver } from '@/shared/utils/zod-resolver'
import { type SignInInput, signInSchema } from '../schemas/auth.schema'

export function useSignIn() {
  const router = useRouter()
  const form = useForm<SignInInput>({ resolver: zodResolver(signInSchema) })

  const mutation = useMutation({
    mutationFn: (data: SignInInput) =>
      signInWithEmailAndPassword(getFirebaseAuth(), data.email, data.password),
    onSuccess: () => {
      router.push('/')
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
