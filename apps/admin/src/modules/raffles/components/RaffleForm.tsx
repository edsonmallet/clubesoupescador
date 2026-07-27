'use client'

import { Button, Input } from '@clube/ui'
import { useCreateRaffle } from '../hooks/useCreateRaffle'

const centsFromReais = (value: string) => Math.round(Number(value) * 100)

export function RaffleForm() {
  const { form, mutation, onSubmit } = useCreateRaffle()
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
        {errors.title && <span className="text-sm text-red-600">{errors.title.message}</span>}
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
          <span className="text-sm text-red-600">{errors.description.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="prize" className="text-sm font-medium">
          Prêmio
        </label>
        <Input id="prize" {...register('prize')} />
        {errors.prize && <span className="text-sm text-red-600">{errors.prize.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ticketPrice" className="text-sm font-medium">
          Preço do bilhete (R$)
        </label>
        <Input
          id="ticketPrice"
          type="number"
          step="0.01"
          {...register('ticketPriceCents', { setValueAs: centsFromReais })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="maxTickets" className="text-sm font-medium">
          Máximo de bilhetes (opcional)
        </label>
        <Input
          id="maxTickets"
          type="number"
          {...register('maxTickets', {
            setValueAs: (v) => (v === '' ? null : Number(v)),
          })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="drawDate" className="text-sm font-medium">
          Data do sorteio (opcional)
        </label>
        <Input
          id="drawDate"
          type="date"
          {...register('drawDate', {
            setValueAs: (v) => (v ? new Date(v).toISOString() : null),
          })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lotteryGame" className="text-sm font-medium">
          Loteria (Caixa)
        </label>
        <Input id="lotteryGame" placeholder="federal" {...register('lotteryGame')} />
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">Não foi possível criar a rifa.</p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Criando...' : 'Criar rifa'}
      </Button>
    </form>
  )
}
