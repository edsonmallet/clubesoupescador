'use client'

import type { Tournament } from '@clube/shared-types'
import { Button } from '@clube/ui'
import Link from 'next/link'
import { useAdminTournaments } from '../hooks/useAdminTournaments'

const STATUS_LABEL: Record<Tournament['status'], string> = {
  open: 'Aberto',
  closed: 'Encerrado',
}

export function TournamentTable() {
  const { data, isLoading } = useAdminTournaments()

  if (isLoading) return <p>Carregando torneios...</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/torneios/novo">
          <Button>Novo torneio</Button>
        </Link>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="py-2">Título</th>
            <th className="py-2">Status</th>
            <th className="py-2">Criado em</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((tournament) => (
            <tr key={tournament.id} className="border-b border-slate-100">
              <td className="py-2">
                <Link
                  href={`/torneios/${tournament.id}`}
                  className="hover:underline"
                >
                  {tournament.title}
                </Link>
              </td>
              <td className="py-2">{STATUS_LABEL[tournament.status]}</td>
              <td className="py-2">
                {new Date(tournament.createdAt).toLocaleDateString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
