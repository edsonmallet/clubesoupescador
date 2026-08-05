'use client'

import {
  HomeIcon,
  StoreIcon,
  TicketIcon,
  UserIcon,
} from '@/shared/components/icons'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  const isSorteiosActive = pathname.startsWith('/rifas')

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-brand-sand/10 bg-brand-dark px-2 py-3">
      <Link
        href="/clube"
        className="flex flex-col items-center gap-1 text-brand-sand/70"
      >
        <HomeIcon width={20} height={20} />
        <span className="text-[10px] tracking-wide">INÍCIO</span>
      </Link>

      <Link
        href="/rifas"
        className={
          isSorteiosActive
            ? 'flex flex-col items-center gap-1 text-brand-rust'
            : 'flex flex-col items-center gap-1 text-brand-sand/70'
        }
      >
        <TicketIcon width={20} height={20} />
        <span className="text-[10px] tracking-wide">SORTEIOS</span>
      </Link>

      <div
        aria-hidden
        className="-mt-6 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-brand-rust"
      >
        <Image
          src="/app-icon-mark.png"
          alt=""
          width={48}
          height={48}
          className="h-full w-full object-cover"
        />
      </div>

      {/* TODO: linkar quando a página de lojas parceiras existir */}
      <button
        type="button"
        disabled
        className="flex flex-col items-center gap-1 text-brand-sand/40"
      >
        <StoreIcon width={20} height={20} />
        <span className="text-[10px] tracking-wide">LOJAS</span>
      </button>

      {/* TODO: linkar quando a página de perfil existir */}
      <button
        type="button"
        disabled
        className="flex flex-col items-center gap-1 text-brand-sand/40"
      >
        <UserIcon width={20} height={20} />
        <span className="text-[10px] tracking-wide">PERFIL</span>
      </button>
    </nav>
  )
}
