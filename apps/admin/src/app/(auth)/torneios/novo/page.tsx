import { TournamentForm } from '@/modules/tournaments/components/TournamentForm'

export default function NovoTorneioPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Novo torneio</h1>
      <TournamentForm />
    </main>
  )
}
