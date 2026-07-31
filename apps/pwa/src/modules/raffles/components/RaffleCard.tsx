import type { Raffle } from '@clube/shared-types'
import Link from 'next/link'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_LABEL: Record<Raffle['status'], string> = {
  open: 'Aberta',
  closed: 'Encerrada',
  drawn: 'Sorteada',
}

export function RaffleCard({ raffle }: { raffle: Raffle }) {
  return (
    <Link
      href={`/rifas/${raffle.id}`}
      className="flex flex-col gap-3 rounded-lg border border-brand-ink/15 p-4 hover:border-brand-rust/60"
    >
      <div className="aspect-video overflow-hidden rounded-md bg-brand-sand/60">
        {raffle.imageUrl && (
          <img
            src={raffle.imageUrl}
            alt={raffle.prize}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <h3 className="text-sm font-semibold">{raffle.prize}</h3>
      <span className="w-fit rounded-full bg-brand-sand/60 px-2 py-0.5 text-xs font-medium">
        {STATUS_LABEL[raffle.status]}
      </span>
      <span className="text-sm text-brand-ink/80">
        Bilhete: {formatPrice(raffle.ticketPriceCents)}
      </span>
    </Link>
  )
}
