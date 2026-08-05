import { LockIcon } from '@/shared/components/icons'
import type { Offer } from '@clube/shared-types'
import { Badge } from '@clube/ui'
import Link from 'next/link'
import { formatPrice } from '../utils'

const LOW_STOCK_THRESHOLD = 10

export function OfferCard({ offer }: { offer: Offer }) {
  const isLocked = offer.priceClubCents === 0

  return (
    <Link
      href={`/clube/${offer.id}`}
      className="flex flex-col gap-3 rounded-lg border border-brand-ink/15 bg-white p-4 transition-colors duration-200 hover:border-brand-rust/60"
    >
      <div className="aspect-square overflow-hidden rounded-md bg-brand-sand/60">
        {offer.images[0] && (
          <img
            src={offer.images[0]}
            alt={offer.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <h3 className="line-clamp-2 text-sm font-medium text-brand-dark">
        {offer.name}
      </h3>

      {offer.stock > 0 && offer.stock < LOW_STOCK_THRESHOLD && (
        <Badge className="bg-amber-100 text-xs text-amber-800">
          Estoque limitado
        </Badge>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-sm text-brand-ink/40 line-through">
          {formatPrice(offer.priceFullCents)}
        </span>
        {isLocked ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-brand-ink/60">
            <LockIcon width={14} height={14} />
            Assine para ver
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
