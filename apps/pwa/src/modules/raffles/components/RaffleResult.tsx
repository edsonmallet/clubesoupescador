'use client'

import { useRaffleResult } from '../hooks/useRaffleResult'

export function RaffleResult({ raffleId }: { raffleId: string }) {
  const { data: result, isLoading } = useRaffleResult(raffleId)

  if (isLoading || !result) return null
  if (result.status !== 'drawn') return null

  return (
    <div className="flex flex-col gap-1 rounded-md border border-emerald-200 bg-emerald-50 p-3">
      <span className="text-sm font-semibold text-emerald-800">
        Sorteio realizado — concurso {result.contestNumber}
      </span>
      <span className="text-sm text-emerald-700">
        Bilhete vencedor: #{String(result.winnerTicket).padStart(4, '0')}
      </span>
      {result.drawnAt && (
        <span className="text-xs text-emerald-600">
          {new Date(result.drawnAt).toLocaleString('pt-BR')}
        </span>
      )}
    </div>
  )
}
