'use client'

import type { Raffle } from '@clube/shared-types'
import { Button, Input } from '@clube/ui'
import Link from 'next/link'
import { useState } from 'react'
import { useAdminRaffles } from '../hooks/useAdminRaffles'
import { useDrawRaffle } from '../hooks/useDrawRaffle'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_LABEL: Record<Raffle['status'], string> = {
  open: 'Aberta',
  closed: 'Encerrada',
  drawn: 'Sorteada',
}

function DrawCell({ raffle }: { raffle: Raffle }) {
  const [contestNumber, setContestNumber] = useState('')
  const draw = useDrawRaffle(raffle.id)

  if (raffle.status === 'drawn') {
    return <span className="text-slate-600">Bilhete #{raffle.winnerTicket}</span>
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Concurso"
        type="number"
        value={contestNumber}
        onChange={(event) => setContestNumber(event.target.value)}
        className="w-28"
      />
      <Button
        size="sm"
        disabled={draw.isPending || !contestNumber}
        onClick={() => draw.mutate(Number(contestNumber))}
      >
        Sortear
      </Button>
    </div>
  )
}

export function RaffleTable() {
  const { data, isLoading } = useAdminRaffles()

  if (isLoading) return <p>Carregando rifas...</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/rifas/nova">
          <Button>Nova rifa</Button>
        </Link>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="py-2">Título</th>
            <th className="py-2">Bilhete</th>
            <th className="py-2">Status</th>
            <th className="py-2">Sorteio</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((raffle) => (
            <tr key={raffle.id} className="border-b border-slate-100">
              <td className="py-2">
                <Link href={`/rifas/${raffle.id}`} className="hover:underline">
                  {raffle.title}
                </Link>
              </td>
              <td className="py-2">{formatPrice(raffle.ticketPriceCents)}</td>
              <td className="py-2">{STATUS_LABEL[raffle.status]}</td>
              <td className="py-2">
                <DrawCell raffle={raffle} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
