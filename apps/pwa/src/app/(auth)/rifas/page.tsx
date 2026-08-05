'use client'

import { RaffleGrid } from '@/modules/raffles/components/RaffleGrid'
import { PageHeader } from '@/shared/components/PageHeader'
import { useState } from 'react'

export default function RifasPage() {
  const [query, setQuery] = useState('')

  return (
    <main className="min-h-screen bg-brand-sand">
      <PageHeader
        logoSrc="/sorteios-logo.png"
        logoAlt="Sorteios do Club"
        logoWidth={224}
        logoHeight={72}
        subtitle="Prêmios que todo pescador adoraria fisgar."
        searchPlaceholder="Buscar sorteio..."
        searchValue={query}
        onSearchChange={setQuery}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-4 md:px-8 lg:px-12">
        <RaffleGrid query={query} />
      </div>
    </main>
  )
}
