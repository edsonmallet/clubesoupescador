'use client'

import { getFirebaseAuth } from '@/shared/services/firebase'
import { useMutation } from '@tanstack/react-query'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export function useSignInWithGoogle() {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: () =>
      signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider()),
    onSuccess: () => {
      router.push('/clube')
    },
  })

  return { mutation, signInWithGoogle: () => mutation.mutate() }
}
