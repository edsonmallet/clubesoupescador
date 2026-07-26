import { RaffleDetail } from '@/modules/raffles/components/RaffleDetail'

export default function RifaPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <RaffleDetail raffleId={params.id} />
    </main>
  )
}
