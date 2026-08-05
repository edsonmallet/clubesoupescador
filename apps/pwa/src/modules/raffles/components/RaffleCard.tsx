import { CalendarIcon, UsersIcon } from '@/shared/components/icons'
import type { Raffle } from '@clube/shared-types'
import Link from 'next/link'
import { daysUntil, formatPrice } from '../utils'

const STATUS_LABEL: Record<Raffle['status'], string> = {
  open: 'SORTEIO ATIVO',
  closed: 'ENCERRADA',
  drawn: 'SORTEADA',
}

const STATUS_CLASS: Record<Raffle['status'], string> = {
  open: 'bg-emerald-600 text-white',
  closed: 'bg-brand-ink/60 text-white',
  drawn: 'bg-brand-rust text-white',
}

export function RaffleCard({ raffle }: { raffle: Raffle }) {
  const daysLeft = raffle.drawDate ? daysUntil(raffle.drawDate) : null

  return (
    <Link
      href={`/rifas/${raffle.id}`}
      className="flex gap-3 rounded-lg border border-brand-ink/10 bg-white p-2 hover:border-brand-rust/50"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-brand-sand/60">
        {raffle.imageUrl && (
          <img
            src={raffle.imageUrl}
            alt={raffle.prize}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1">
        <span
          className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASS[raffle.status]}`}
        >
          {STATUS_LABEL[raffle.status]}
        </span>
        <h3 className="line-clamp-1 text-sm font-semibold text-brand-dark">
          {raffle.title}
        </h3>
        <span className="text-sm text-brand-rust">
          {formatPrice(raffle.ticketPriceCents)} por número
        </span>
        <div className="flex items-center gap-3 text-xs text-brand-ink/60">
          <span className="flex items-center gap-1">
            <UsersIcon width={13} height={13} />
            {raffle.maxTickets ?? '—'} números
          </span>
          {daysLeft !== null && (
            <span className="flex items-center gap-1">
              <CalendarIcon width={13} height={13} />
              {daysLeft}d
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
