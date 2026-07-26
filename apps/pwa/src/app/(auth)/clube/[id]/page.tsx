import { OfferDetail } from '@/modules/offers/components/OfferDetail'

export default function OfferPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <OfferDetail offerId={params.id} />
    </main>
  )
}
