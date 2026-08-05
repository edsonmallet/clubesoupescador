'use client'

import { DetailBackHeader } from '@/shared/components/DetailBackHeader'
import { MapPinIcon, PhoneIcon, StarIcon } from '@/shared/components/icons'
import { Badge } from '@clube/ui'
import { useStore } from '../hooks/useStore'
import { formatMemberSince } from '../utils'

export function StoreDetail({ storeId }: { storeId: string }) {
  const { data: store, isLoading } = useStore(storeId)

  if (isLoading || !store) {
    return <p className="p-6 text-brand-ink/70">Carregando...</p>
  }

  return (
    <div className="min-h-screen bg-brand-sand pb-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 md:px-8 lg:px-12">
        <div className="pt-4">
          <DetailBackHeader title="Perfil da loja" />
        </div>

        <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 text-center shadow-sm">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-brand-sand/60">
            <img
              src={store.logoUrl}
              alt={store.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl text-brand-dark">
              {store.name}
            </h1>
            <Badge className="self-center bg-brand-sand px-3 text-xs text-brand-ink/70">
              {store.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-brand-rust">
            <StarIcon width={18} height={18} className="fill-brand-rust" />
            <span className="font-semibold">{store.rating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-brand-ink/80">{store.description}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-brand-ink/80">
            <MapPinIcon width={18} height={18} className="text-brand-rust" />
            {store.address}
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-ink/80">
            <PhoneIcon width={18} height={18} className="text-brand-rust" />
            {store.phone}
          </div>
          <div className="border-t border-brand-ink/10 pt-3 text-xs text-brand-ink/50">
            Loja parceira desde {formatMemberSince(store.memberSince)}
          </div>
        </div>
      </div>
    </div>
  )
}
