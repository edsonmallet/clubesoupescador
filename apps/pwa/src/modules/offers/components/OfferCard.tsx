import type { Offer } from '@clube/shared-types'
import Link from 'next/link'

const LOW_STOCK_THRESHOLD = 10

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function OfferCard({ offer }: { offer: Offer }) {
  const isLocked = offer.priceClubCents === 0

  return (
    <Link
      href={`/clube/${offer.id}`}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-400"
    >
      <div className="aspect-square overflow-hidden rounded-md bg-slate-100">
        {offer.images[0] && (
          <img
            src={offer.images[0]}
            alt={offer.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <h3 className="line-clamp-2 text-sm font-medium">{offer.name}</h3>

      {offer.stock > 0 && offer.stock < LOW_STOCK_THRESHOLD && (
        <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
          Estoque limitado
        </span>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-sm text-slate-400 line-through">
          {formatPrice(offer.priceFullCents)}
        </span>
        {isLocked ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-slate-500">
            🔒 Assine para ver
          </span>
        ) : (
          <span className="text-lg font-bold text-emerald-700">
            {formatPrice(offer.priceClubCents)}
          </span>
        )}
      </div>
    </Link>
  )
}
