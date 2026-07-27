'use client'

import type { Submission } from '@clube/shared-types'
import { Button, Input } from '@clube/ui'
import { useState } from 'react'
import { useSetScore } from '../hooks/useSetScore'
import { useSubmissions } from '../hooks/useSubmissions'

function ScoreCell({
  submission,
  tournamentId,
}: { submission: Submission; tournamentId: string }) {
  const [score, setScore] = useState(String(submission.manualScore ?? ''))
  const setManualScore = useSetScore(tournamentId)

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        value={score}
        onChange={(event) => setScore(event.target.value)}
        className="w-24"
      />
      <Button
        size="sm"
        disabled={setManualScore.isPending || score === ''}
        onClick={() =>
          setManualScore.mutate({
            submissionId: submission.id,
            manualScore: Number(score),
          })
        }
      >
        Salvar
      </Button>
    </div>
  )
}

export function SubmissionList({ tournamentId }: { tournamentId: string }) {
  const { data: submissions, isLoading } = useSubmissions(tournamentId)

  if (isLoading) return <p>Carregando submissões...</p>
  if (!submissions?.length)
    return <p className="text-slate-600">Nenhuma submissão ainda.</p>

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="py-2">Mídia</th>
          <th className="py-2">Autor</th>
          <th className="py-2">Votos</th>
          <th className="py-2">Score manual</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map((submission) => (
          <tr key={submission.id} className="border-b border-slate-100">
            <td className="py-2">
              <a
                href={submission.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:underline"
              >
                Ver mídia
              </a>
            </td>
            <td className="py-2">{submission.authorUid}</td>
            <td className="py-2">{submission.voteScore}</td>
            <td className="py-2">
              <ScoreCell submission={submission} tournamentId={tournamentId} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
