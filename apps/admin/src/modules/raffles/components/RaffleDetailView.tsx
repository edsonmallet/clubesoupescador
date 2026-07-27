'use client'

import { Button, Input } from '@clube/ui'
import { useState } from 'react'
import { useAdminRaffle } from '../hooks/useAdminRaffle'
import { useDrawRaffle } from '../hooks/useDrawRaffle'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function RaffleDetailView({ raffleId }: { raffleId: string }) {
  const { data: raffle, isLoading } = useAdminRaffle(raffleId)
  const [contestNumber, setContestNumber] = useState('')
  const draw = useDrawRaffle(raffleId)

  if (isLoading || !raffle) return <p>Carregando...</p>

  return (
    <div className="flex max-w-lg flex-col gap-3">
      <h1 className="text-2xl font-bold">{raffle.title}</h1>
      <p className="text-slate-600">{raffle.description}</p>
      <p>
        <span className="font-medium">Prêmio:</span> {raffle.prize}
      </p>
      <p>
        <span className="font-medium">Bilhete:</span> {formatPrice(raffle.ticketPriceCents)}
      </p>
      <p>
        <span className="font-medium">Máx. bilhetes:</span> {raffle.maxTickets ?? 'Ilimitado'}
      </p>
      <p>
        <span className="font-medium">Loteria:</span> {raffle.lotteryGame}
      </p>
      <p>
        <span className="font-medium">Status:</span> {raffle.status}
      </p>

      {raffle.status === 'drawn' ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p>Concurso {raffle.contestNumber}</p>
          <p>Bilhete vencedor: #{raffle.winnerTicket}</p>
          <p className="text-sm text-slate-600">Ganhador: {raffle.winnerUid}</p>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Número do concurso"
            type="number"
            value={contestNumber}
            onChange={(event) => setContestNumber(event.target.value)}
          />
          <Button
            disabled={draw.isPending || !contestNumber}
            onClick={() => draw.mutate(Number(contestNumber))}
          >
            {draw.isPending ? 'Sorteando...' : 'Disparar sorteio'}
          </Button>
        </div>
      )}
    </div>
  )
}
