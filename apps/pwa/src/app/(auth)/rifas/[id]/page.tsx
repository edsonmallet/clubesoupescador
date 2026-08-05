import { RaffleDetail } from '@/modules/raffles/components/RaffleDetail'

export default function RifaPage({ params }: { params: { id: string } }) {
  return <RaffleDetail raffleId={params.id} />
}
