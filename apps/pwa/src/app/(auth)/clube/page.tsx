'use client'

import { OfferGrid } from '@/modules/offers/components/OfferGrid'
import { PageHeader } from '@/shared/components/PageHeader'
import { useState } from 'react'

export default function ClubePage() {
  const [query, setQuery] = useState('')

  return (
    <main className="min-h-screen bg-brand-sand">
      <PageHeader
        logoSrc="/ofertas-logo.png"
        logoAlt="Ofertas do Club"
        logoWidth={225}
        logoHeight={77}
        subtitle="Preço de custo pra quem é do Club."
        searchPlaceholder="Buscar oferta..."
        searchValue={query}
        onSearchChange={setQuery}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-4 md:px-8 lg:px-12">
        <OfferGrid query={query} />
      </div>
    </main>
  )
}
