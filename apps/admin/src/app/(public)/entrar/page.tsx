import { SignInForm } from '@/modules/auth/components/SignInForm'

export default function SignInPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold">Painel do Lojista</h1>
      <SignInForm />
    </main>
  )
}
