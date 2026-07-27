'use client'

import { Button, Input } from '@clube/ui'
import { useCreateTournament } from '../hooks/useCreateTournament'

export function TournamentForm() {
  const { form, mutation, onSubmit } = useCreateTournament()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Título
        </label>
        <Input id="title" {...register('title')} />
        {errors.title && (
          <span className="text-sm text-red-600">{errors.title.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.description && (
          <span className="text-sm text-red-600">
            {errors.description.message}
          </span>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">
          Não foi possível criar o torneio.
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Criando...' : 'Criar torneio'}
      </Button>
    </form>
  )
}
