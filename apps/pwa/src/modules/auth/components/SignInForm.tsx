'use client'

import {
  EyeIcon,
  EyeOffIcon,
  FacebookIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
} from '@/shared/components/icons'
import { Button, Input } from '@clube/ui'
import Link from 'next/link'
import { useState } from 'react'
import { useSignIn } from '../hooks/useSignIn'
import { useSignInWithGoogle } from '../hooks/useSignInWithGoogle'

export function SignInForm() {
  const { form, mutation, onSubmit } = useSignIn()
  const {
    register,
    formState: { errors },
  } = form
  const [showPassword, setShowPassword] = useState(false)
  const { mutation: googleMutation, signInWithGoogle } = useSignInWithGoogle()

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="email"
          className="text-xs font-semibold uppercase text-brand-ink/70"
        >
          E-mail
        </label>
        <div className="relative">
          <MailIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className="pl-9"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <span className="text-sm text-red-600">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase text-brand-ink/70"
        >
          Senha
        </label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            className="pl-9 pr-9"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-ink/40 hover:text-brand-ink/70"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {errors.password && (
          <span className="text-sm text-red-600">
            {errors.password.message}
          </span>
        )}
        <button
          type="button"
          disabled
          className="self-end text-xs text-brand-ink/50"
        >
          Esqueci minha senha
        </button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">Email ou senha inválidos.</p>
      )}

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="bg-brand-dark tracking-wide hover:bg-brand-dark/90"
      >
        {mutation.isPending ? 'ENTRANDO...' : 'ENTRAR'}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-brand-ink/15" />
        <span className="text-[11px] tracking-wide text-brand-ink/50">
          OU CONTINUE COM
        </span>
        <div className="h-px flex-1 bg-brand-ink/15" />
      </div>

      {googleMutation.isError && (
        <p className="text-sm text-red-600">
          Não foi possível entrar com Google. Tente novamente.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          disabled={googleMutation.isPending}
          onClick={signInWithGoogle}
          className="gap-2 text-brand-ink/70"
        >
          <GoogleIcon />{' '}
          {googleMutation.isPending ? 'Entrando...' : 'Google'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          className="hidden gap-2 text-brand-ink/70 md:flex"
        >
          <FacebookIcon /> Facebook
        </Button>
      </div>

      <p className="text-center text-sm text-brand-ink/80">
        Ainda não tem conta?{' '}
        <Link
          href="/cadastro"
          className="font-medium text-brand-rust underline"
        >
          Cadastre-se
        </Link>
      </p>
    </form>
  )
}
