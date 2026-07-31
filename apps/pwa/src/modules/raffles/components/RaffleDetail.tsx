'use client'

import { Button, Input } from '@clube/ui'
import { useState } from 'react'
import { useBuyTickets } from '../hooks/useBuyTickets'
import { useJoinRaffle } from '../hooks/useJoinRaffle'
import { useRaffle } from '../hooks/useRaffle'
import { RaffleResult } from './RaffleResult'
import { TicketList } from './TicketList'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function RaffleDetail({ raffleId }: { raffleId: string }) {
  const { data: raffle, isLoading } = useRaffle(raffleId)
  const joinRaffle = useJoinRaffle(raffleId)
  const buyTickets = useBuyTickets(raffleId)
  const [extraQty, setExtraQty] = useState(1)

  if (isLoading || !raffle) return <p>Carregando...</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="aspect-video overflow-hidden rounded-lg bg-brand-sand/60">
        {raffle.imageUrl && (
          <img
            src={raffle.imageUrl}
            alt={raffle.prize}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{raffle.prize}</h1>
        <p className="text-brand-ink/80">{raffle.description}</p>
        <span className="text-sm text-brand-ink/60">
          Bilhete: {formatPrice(raffle.ticketPriceCents)}
        </span>
      </div>

      <RaffleResult raffleId={raffleId} />

      {raffle.status === 'open' && (
        <div className="flex flex-col gap-3 rounded-md border border-brand-ink/15 p-3">
          <Button
            onClick={() => joinRaffle.mutate()}
            disabled={joinRaffle.isPending}
          >
            {joinRaffle.isPending
              ? 'Entrando...'
              : 'Entrar com minha assinatura'}
          </Button>
          {joinRaffle.isError && (
            <p className="text-sm text-red-600">
              Não foi possível entrar nesta rifa (talvez você já tenha entrado).
            </p>
          )}

          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="extraQty" className="text-sm font-medium">
                Comprar bilhetes extras
              </label>
              <Input
                id="extraQty"
                type="number"
                min={1}
                value={extraQty}
                onChange={(event) => setExtraQty(Number(event.target.value))}
              />
            </div>
            <Button
              variant="outline"
              disabled={buyTickets.isPending}
              onClick={() => buyTickets.mutate(extraQty)}
            >
              {buyTickets.isPending ? 'Processando...' : 'Comprar'}
            </Button>
          </div>
        </div>
      )}

      <TicketList raffleId={raffleId} />
    </div>
  )
}
