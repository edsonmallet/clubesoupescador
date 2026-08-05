import { OfferDetail } from '@/modules/offers/components/OfferDetail'

export default function OfferPage({ params }: { params: { id: string } }) {
  return <OfferDetail offerId={params.id} />
}
