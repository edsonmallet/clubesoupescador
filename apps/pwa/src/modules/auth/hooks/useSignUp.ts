'use client'

import { getFirebaseAuth } from '@/shared/services/firebase'
import { zodResolver } from '@/shared/utils/zod-resolver'
import { useMutation } from '@tanstack/react-query'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { type SignUpInput, signUpSchema } from '../schemas/auth.schema'
import { authService } from '../services/auth.service'

export function useSignUp() {
  const router = useRouter()
  const form = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) })

  const mutation = useMutation({
    mutationFn: async (data: SignUpInput) => {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        data.email,
        data.password,
      )
      await updateProfile(credential.user, { displayName: data.name })
      return authService.register()
    },
    onSuccess: () => {
      router.push('/planos')
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, mutation, onSubmit }
}
