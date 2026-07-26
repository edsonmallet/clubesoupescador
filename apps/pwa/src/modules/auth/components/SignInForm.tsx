'use client'

import { Button, Input } from '@clube/ui'
import Link from 'next/link'
import { useSignIn } from '../hooks/useSignIn'

export function SignInForm() {
  const { form, mutation, onSubmit } = useSignIn()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <span className="text-sm text-red-600">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && (
          <span className="text-sm text-red-600">
            {errors.password.message}
          </span>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">Email ou senha inválidos.</p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Entrando...' : 'Entrar'}
      </Button>

      <p className="text-sm text-slate-600">
        Não tem conta?{' '}
        <Link href="/cadastro" className="underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  )
}
