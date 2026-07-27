import { TournamentTable } from '@/modules/tournaments/components/TournamentTable'

export default function TorneiosPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Torneios</h1>
      <TournamentTable />
    </main>
  )
}
