import { OfferGrid } from '@/modules/offers/components/OfferGrid'

export default function ClubePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Ofertas do clube</h1>
      <OfferGrid />
    </main>
  )
}
