import { SignUpForm } from '@/modules/auth/components/SignUpForm'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <SignUpForm />
      <p className="text-sm text-brand-ink/80">
        Já tem conta?{' '}
        <Link href="/entrar" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  )
}
