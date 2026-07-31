'use client'

import type { CashbackEntry } from '@clube/shared-types'
import { useState } from 'react'
import { useCashbackHistory } from '../hooks/useCashbackHistory'

const formatPrice = (cents: number) =>
  (Math.abs(cents) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

const TYPE_ICON: Record<CashbackEntry['type'], string> = {
  earned_purchase: '💰',
  redeemed: '🛒',
  expired_to_xp: '⏳',
  manual_adjustment: '⚙️',
}

const TYPE_LABEL: Record<CashbackEntry['type'], string> = {
  earned_purchase: 'Cashback ganho',
  redeemed: 'Usado em compra',
  expired_to_xp: 'Expirado (virou XP)',
  manual_adjustment: 'Ajuste',
}

export function CashbackHistory() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useCashbackHistory(page)

  if (isLoading) return <p>Carregando extrato...</p>

  if (!data?.items.length) {
    return <p className="text-brand-ink/80">Nenhuma movimentação ainda.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {data.items.map((entry) => {
        const isCredit = entry.amountCents > 0
        return (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-md border border-brand-ink/10 p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{TYPE_ICON[entry.type]}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {TYPE_LABEL[entry.type]}
                </span>
                <span className="text-xs text-brand-ink/40">
                  {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            <span
              className={
                isCredit
                  ? 'font-semibold text-emerald-700'
                  : 'font-semibold text-red-600'
              }
            >
              {isCredit ? '+' : '-'}
              {formatPrice(entry.amountCents)}
            </span>
          </div>
        )
      })}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="text-sm text-brand-ink/80 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page * 20 >= data.total}
          onClick={() => setPage((p) => p + 1)}
          className="text-sm text-brand-ink/80 disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
