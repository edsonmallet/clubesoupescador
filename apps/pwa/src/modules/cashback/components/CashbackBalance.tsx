'use client'

import { formatPrice } from '@/shared/utils/format'
import { useCashbackBalance } from '../hooks/useCashbackBalance'

export function CashbackBalance() {
  const { data: balance, isLoading } = useCashbackBalance()

  if (isLoading || !balance) return <p>Carregando saldo...</p>

  const expiringPct =
    balance.availableCents > 0
      ? Math.min(
          100,
          (balance.expiringSoonCents / balance.availableCents) * 100,
        )
      : 0

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-brand-ink/15 p-4">
      <div>
        <span className="text-sm text-brand-ink/60">Saldo disponível</span>
        <p className="text-3xl font-bold text-emerald-700">
          {formatPrice(balance.availableCents)}
        </p>
      </div>

      {balance.expiringSoonCents > 0 && (
        <div className="flex flex-col gap-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-sand/60">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${expiringPct}%` }}
            />
          </div>
          <span className="text-sm text-amber-700">
            {formatPrice(balance.expiringSoonCents)} a vencer
            {balance.nextExpiryAt &&
              ` em ${new Date(balance.nextExpiryAt).toLocaleDateString('pt-BR')}`}
          </span>
        </div>
      )}
    </div>
  )
}
