'use client'

import { DetailBackHeader } from '@/shared/components/DetailBackHeader'
import {
  CalendarIcon,
  ChevronDownIcon,
  ShareIcon,
  TagIcon,
  TrophyIcon,
  UsersIcon,
} from '@/shared/components/icons'
import { Button } from '@clube/ui'
import { useMemo, useState } from 'react'
import { useBuyTickets } from '../hooks/useBuyTickets'
import { useJoinRaffle } from '../hooks/useJoinRaffle'
import { useRaffle } from '../hooks/useRaffle'
import { useRaffleNumbers } from '../hooks/useRaffleNumbers'
import { daysUntil, formatDate, formatPrice } from '../utils'
import { RaffleImageLightbox } from './RaffleImageLightbox'
import { RaffleResult } from './RaffleResult'
import { TicketList } from './TicketList'

const QUANTITY_SHORTCUTS = [
  { qty: 1, discount: 0, label: '1 número' },
  { qty: 5, discount: 0.1, label: '5 números' },
  { qty: 10, discount: 0.15, label: '10 números' },
]

export function RaffleDetail({ raffleId }: { raffleId: string }) {
  const { data: raffle, isLoading } = useRaffle(raffleId)
  const { data: numbers } = useRaffleNumbers(raffleId)
  const joinRaffle = useJoinRaffle(raffleId)
  const buyTickets = useBuyTickets(raffleId)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const total = numbers?.total ?? raffle?.maxTickets ?? 0
  const takenSet = useMemo(() => new Set(numbers?.taken ?? []), [numbers])
  const soldCount = takenSet.size
  const progress = total > 0 ? Math.round((soldCount / total) * 100) : 0

  const availableNumbers = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => i + 1).filter(
        (n) => !takenSet.has(n),
      ),
    [total, takenSet],
  )

  function toggleNumber(n: number) {
    if (takenSet.has(n)) return
    setSelected((current) =>
      current.includes(n) ? current.filter((x) => x !== n) : [...current, n],
    )
  }

  function pickRandom(qty: number) {
    const pool = availableNumbers.filter((n) => !selected.includes(n))
    const picked: number[] = []
    const copy = [...pool]
    while (picked.length < qty && copy.length > 0) {
      const idx = Math.floor(Math.random() * copy.length)
      picked.push(copy.splice(idx, 1)[0])
    }
    setSelected(picked)
  }

  if (isLoading || !raffle) {
    return <p className="p-6 text-brand-ink/70">Carregando...</p>
  }

  const daysLeft = raffle.drawDate ? daysUntil(raffle.drawDate) : null
  const discount = selected.length >= 10 ? 0.15 : selected.length >= 5 ? 0.1 : 0
  const totalCents = Math.round(
    selected.length * raffle.ticketPriceCents * (1 - discount),
  )
  const prizeValueCents = raffle.ticketPriceCents * (raffle.maxTickets ?? 0)

  return (
    <div className="min-h-screen bg-brand-sand pb-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 md:px-8 lg:px-12">
        <div className="pt-4">
          <DetailBackHeader
            title="Detalhes do sorteio"
            trailing={
              // TODO: usar Web Share API real quando fizer sentido
              <button type="button" disabled aria-label="Compartilhar">
                <ShareIcon
                  width={20}
                  height={20}
                  className="text-brand-ink/40"
                />
              </button>
            }
          />
        </div>

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="relative mx-auto block aspect-[16/10] w-full max-w-xs overflow-hidden rounded-xl bg-brand-sand/60 shadow-sm"
          aria-label="Ampliar imagem"
        >
          {raffle.imageUrl && (
            <img
              src={raffle.imageUrl}
              alt={raffle.prize}
              className="h-full w-full object-cover"
            />
          )}
          {/* TODO: dots viram funcionais quando houver múltiplas imagens por rifa */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-sand" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-sand/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-sand/40" />
          </div>
        </button>

        {lightboxOpen && raffle.imageUrl && (
          <RaffleImageLightbox
            src={raffle.imageUrl}
            alt={raffle.prize}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl text-brand-dark">
            {raffle.title}
          </h1>
          <p className="text-sm text-brand-ink/70">{raffle.description}</p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="flex flex-col items-center gap-1">
              <TrophyIcon width={20} height={20} className="text-brand-rust" />
              <span className="text-[10px] uppercase text-brand-ink/60">
                Valor do prêmio
              </span>
              <span className="text-sm font-semibold text-brand-dark">
                {formatPrice(prizeValueCents)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <TagIcon width={20} height={20} className="text-brand-rust" />
              <span className="text-[10px] uppercase text-brand-ink/60">
                Valor do número
              </span>
              <span className="text-sm font-semibold text-brand-dark">
                {formatPrice(raffle.ticketPriceCents)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CalendarIcon
                width={20}
                height={20}
                className="text-brand-rust"
              />
              <span className="text-[10px] uppercase text-brand-ink/60">
                Sorteio em
              </span>
              <span className="text-sm font-semibold text-brand-dark">
                {daysLeft !== null ? `${daysLeft} dias` : '—'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <UsersIcon width={20} height={20} className="text-brand-rust" />
              <span className="text-[10px] uppercase text-brand-ink/60">
                Vendidos
              </span>
              <span className="text-sm font-semibold text-brand-dark">
                {soldCount} / {total}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-brand-ink/60">
              Progresso do sorteio
            </span>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-sand">
                <div
                  className="h-full rounded-full bg-brand-dark"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-brand-ink/70">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setAboutOpen((v) => !v)}
            className="flex items-center justify-between text-left"
          >
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-ink/70">
              Sobre o sorteio
            </span>
            <ChevronDownIcon
              width={18}
              height={18}
              className={`text-brand-ink/50 transition-transform ${aboutOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {aboutOpen && (
            <p className="animate-fade-in text-sm text-brand-ink/80">
              {raffle.description}
            </p>
          )}
        </div>

        {raffle.status === 'open' && (
          <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-brand-ink/70">
                Escolha seus números
              </span>
              {/* TODO: abrir explicação real de como funciona a escolha de números */}
              <button
                type="button"
                disabled
                className="text-xs font-medium text-brand-rust/70"
              >
                Como funciona?
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {QUANTITY_SHORTCUTS.map(({ qty, discount: d, label }) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => pickRandom(qty)}
                  className="relative flex flex-col items-center gap-1 rounded-lg border border-brand-ink/15 bg-white py-3 text-xs font-medium text-brand-ink hover:border-brand-rust/60"
                >
                  {d > 0 && (
                    <span className="absolute -top-2 right-1 rounded-full bg-brand-rust px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      -{d * 100}%
                    </span>
                  )}
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => pickRandom(1)}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border border-brand-ink/15 bg-white py-3 text-center text-[11px] font-medium leading-tight text-brand-ink hover:border-brand-rust/60"
              >
                Me dê números da sorte
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-brand-ink/10 pt-4">
              <span className="text-sm font-semibold uppercase tracking-wide text-brand-ink/70">
                Números disponíveis
              </span>
              <div className="flex items-center gap-4 text-xs text-brand-ink/70">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-brand-ink/30 bg-white" />
                  Disponível
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-brand-dark" />
                  Selecionado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-brand-ink/20" />
                  Indisponível
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                {Array.from(
                  { length: Math.min(total, 25) },
                  (_, i) => i + 1,
                ).map((n) => {
                  const isTaken = takenSet.has(n)
                  const isSelected = selected.includes(n)
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={isTaken}
                      onClick={() => toggleNumber(n)}
                      className={`rounded-md border py-2 text-xs font-medium ${
                        isTaken
                          ? 'cursor-not-allowed border-transparent bg-brand-ink/20 text-brand-ink/40'
                          : isSelected
                            ? 'border-brand-dark bg-brand-dark text-white'
                            : 'border-brand-ink/20 bg-white text-brand-ink hover:border-brand-rust/60'
                      }`}
                    >
                      {String(n).padStart(3, '0')}
                    </button>
                  )
                })}
              </div>
            </div>

            {selected.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border border-brand-ink/10 p-3">
                <button
                  type="button"
                  onClick={() => setSummaryOpen((v) => !v)}
                  className="flex items-center justify-between text-left"
                >
                  <span className="text-sm font-semibold text-brand-dark">
                    Ver resumo ({selected.length})
                  </span>
                  <ChevronDownIcon
                    width={16}
                    height={16}
                    className={`text-brand-ink/50 transition-transform ${summaryOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {summaryOpen && (
                  <div className="flex animate-fade-in flex-wrap gap-1.5">
                    {selected
                      .sort((a, b) => a - b)
                      .map((n) => (
                        <span
                          key={n}
                          className="rounded-md border border-brand-ink/20 px-2 py-1 font-mono text-xs"
                        >
                          #{String(n).padStart(3, '0')}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-brand-ink/10 pt-4">
              <Button
                onClick={() => joinRaffle.mutate()}
                disabled={joinRaffle.isPending}
                variant="outline"
              >
                {joinRaffle.isPending
                  ? 'Entrando...'
                  : 'Entrar com minha assinatura'}
              </Button>
              {joinRaffle.isError && (
                <p className="text-sm text-red-600">
                  Não foi possível entrar nesta rifa (talvez você já tenha
                  entrado).
                </p>
              )}
            </div>
          </div>
        )}

        <RaffleResult raffleId={raffleId} />

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <TicketList raffleId={raffleId} />
        </div>
      </div>

      {raffle.status === 'open' && selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 bg-brand-dark">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4 md:px-8 lg:px-12">
            <div className="flex flex-col text-brand-sand">
              <span className="text-xs text-brand-sand/70">
                {selected.length} número{selected.length > 1 ? 's' : ''}{' '}
                selecionado{selected.length > 1 ? 's' : ''}
              </span>
              <span className="text-lg font-bold">
                {formatPrice(totalCents)}
              </span>
            </div>
            <Button
              onClick={() => buyTickets.mutate(selected.length)}
              disabled={buyTickets.isPending}
              className="bg-brand-rust tracking-wide hover:bg-brand-rust/90"
            >
              {buyTickets.isPending ? 'PROCESSANDO...' : 'CONTINUAR'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
