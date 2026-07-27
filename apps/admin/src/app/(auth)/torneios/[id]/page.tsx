import { TournamentDetailView } from '@/modules/tournaments/components/TournamentDetailView'

export default function TorneioDetailPage({
  params,
}: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <TournamentDetailView tournamentId={params.id} />
    </main>
  )
}
