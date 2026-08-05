import { MapPinIcon, StarIcon } from '@/shared/components/icons'
import { Badge } from '@clube/ui'
import Link from 'next/link'
import type { Store } from '../services/stores.service'

export function StoreCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/lojas/${store.id}`}
      className="flex gap-3 rounded-lg border border-brand-ink/10 bg-white p-2 transition-colors duration-200 hover:border-brand-rust/50"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-brand-sand/60">
        <img
          src={store.logoUrl}
          alt={store.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1">
        <Badge className="bg-brand-sand text-brand-ink/70">
          {store.category}
        </Badge>
        <h3 className="line-clamp-1 text-sm font-semibold text-brand-dark">
          {store.name}
        </h3>
        <div className="flex items-center gap-1 text-sm text-brand-rust">
          <StarIcon width={14} height={14} className="fill-brand-rust" />
          {store.rating.toFixed(1)}
        </div>
        <div className="flex items-center gap-1 text-xs text-brand-ink/60">
          <MapPinIcon width={13} height={13} />
          {store.city}/{store.state}
        </div>
      </div>
    </Link>
  )
}
