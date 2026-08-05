'use client'

import { useCashbackBalance } from '@/modules/cashback/hooks/useCashbackBalance'
import {
  ChevronRightIcon,
  EditIcon,
  LogoutIcon,
  TicketIcon,
} from '@/shared/components/icons'
import { formatPrice } from '@/shared/utils/format'
import Link from 'next/link'
import { useLogout } from '../hooks/useLogout'
import { useProfile } from '../hooks/useProfile'

function MenuLink({
  href,
  icon,
  label,
  value,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-brand-ink/10 px-4 py-3.5 last:border-b-0 hover:bg-brand-sand/40"
    >
      <span className="text-brand-rust">{icon}</span>
      <span className="flex-1 text-sm font-medium text-brand-dark">
        {label}
      </span>
      {value && <span className="text-sm text-brand-ink/60">{value}</span>}
      <ChevronRightIcon width={18} height={18} className="text-brand-ink/40" />
    </Link>
  )
}

export function ProfileMenu() {
  const { data: stats } = useProfile()
  const { data: cashback } = useCashbackBalance()
  const { logout, isPending } = useLogout()

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-xl bg-white p-4 shadow-sm">
          <span className="text-xs text-brand-ink/60">Pedidos feitos</span>
          <span className="text-xl font-bold text-brand-dark">
            {stats?.ordersCount ?? '—'}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-white p-4 shadow-sm">
          <span className="text-xs text-brand-ink/60">Rifas participadas</span>
          <span className="text-xl font-bold text-brand-dark">
            {stats?.rafflesCount ?? '—'}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <MenuLink
          href="/carteira"
          icon={<TicketIcon width={18} height={18} />}
          label="Carteira / Cashback"
          value={cashback ? formatPrice(cashback.availableCents) : undefined}
        />
        <MenuLink
          href="/pedidos"
          icon={<TicketIcon width={18} height={18} />}
          label="Meus pedidos"
        />
        <MenuLink
          href="/rifas"
          icon={<TicketIcon width={18} height={18} />}
          label="Meus bilhetes"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {/* TODO: tela de edição de perfil ainda não existe */}
        <button
          type="button"
          disabled
          className="flex w-full items-center gap-3 border-b border-brand-ink/10 px-4 py-3.5 text-left text-brand-ink/40"
        >
          <EditIcon width={18} height={18} />
          <span className="flex-1 text-sm font-medium">Editar perfil</span>
        </button>
        <button
          type="button"
          onClick={logout}
          disabled={isPending}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-red-600 hover:bg-red-50"
        >
          <LogoutIcon width={18} height={18} />
          <span className="flex-1 text-sm font-medium">
            {isPending ? 'Saindo...' : 'Sair'}
          </span>
        </button>
      </div>
    </div>
  )
}
