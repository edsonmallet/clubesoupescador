'use client'

import { signInWithCustomToken } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getFirebaseAuth } from '@/shared/services/firebase'

export default function ImpersonatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError(true)
      return
    }

    signInWithCustomToken(getFirebaseAuth(), token)
      .then(() => router.replace('/'))
      .catch(() => setError(true))
  }, [searchParams, router])

  if (error) {
    return <p className="p-8 text-sm text-red-600">Não foi possível autenticar. Peça um novo link ao super admin.</p>
  }

  return <p className="p-8 text-sm text-slate-600">Entrando...</p>
}
