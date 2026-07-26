'use client'

import { useMyTickets } from '../hooks/useMyTickets'

export function TicketList({ raffleId }: { raffleId: string }) {
  const { data: tickets, isLoading } = useMyTickets(raffleId)

  if (isLoading) return <p>Carregando seus bilhetes...</p>

  if (!tickets?.length) {
    return (
      <p className="text-sm text-slate-600">
        Você ainda não tem bilhetes nesta rifa.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">
        Meus bilhetes ({tickets.length})
      </span>
      <div className="flex flex-wrap gap-2">
        {tickets.map((ticket) => (
          <span
            key={ticket.id}
            className={`rounded-md border px-2 py-1 text-sm font-mono ${
              ticket.status === 'pending'
                ? 'border-amber-300 text-amber-700'
                : 'border-slate-300 text-slate-700'
            }`}
          >
            #{String(ticket.number).padStart(4, '0')}
          </span>
        ))}
      </div>
    </div>
  )
}
