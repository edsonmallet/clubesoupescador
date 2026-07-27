'use client'

import { useAdminTournament } from '../hooks/useAdminTournament'
import { SubmissionList } from './SubmissionList'

export function TournamentDetailView({
  tournamentId,
}: { tournamentId: string }) {
  const { data: tournament, isLoading } = useAdminTournament(tournamentId)

  if (isLoading || !tournament) return <p>Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{tournament.title}</h1>
        <p className="text-slate-600">{tournament.description}</p>
        <p className="text-sm text-slate-500">
          Status: {tournament.status === 'open' ? 'Aberto' : 'Encerrado'}
        </p>
      </div>

      <h2 className="text-lg font-semibold">Submissões</h2>
      <SubmissionList tournamentId={tournamentId} />
    </div>
  )
}
