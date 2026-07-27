import { RaffleDetailView } from '@/modules/raffles/components/RaffleDetailView'

export default function RifaDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <RaffleDetailView raffleId={params.id} />
    </main>
  )
}
