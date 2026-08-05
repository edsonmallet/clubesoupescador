'use client'

import { OfferGrid } from '@/modules/offers/components/OfferGrid'
import { BellIcon, SearchIcon } from '@/shared/components/icons'
import { Input } from '@clube/ui'
import Image from 'next/image'
import { useState } from 'react'

export default function ClubePage() {
  const [query, setQuery] = useState('')

  return (
    <main className="min-h-screen bg-brand-sand">
      <div className="bg-brand-dark">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/app-icon-mark.png"
                alt=""
                width={40}
                height={40}
                className="rounded-xl"
              />
              <div className="flex flex-col leading-none">
                <span className="font-heading text-2xl tracking-wide text-brand-sand">
                  OFERTAS
                </span>
                <span className="font-heading text-xs tracking-[0.35em] text-brand-rust">
                  DO CLUB
                </span>
              </div>
            </div>
            <div className="relative">
              <BellIcon width={22} height={22} className="text-brand-sand" />
              {/* TODO: contador real de notificações não lidas */}
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-brand-dark bg-brand-rust" />
            </div>
          </div>
          <p className="text-sm text-brand-sand/80">
            Preço de custo pra quem é do Club.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pt-4 md:px-8 lg:px-12">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" />
          <Input
            type="search"
            placeholder="Buscar oferta..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="bg-white pl-9"
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-4 md:px-8 lg:px-12">
        <OfferGrid query={query} />
      </div>
    </main>
  )
}
