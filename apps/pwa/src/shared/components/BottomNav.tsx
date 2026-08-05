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

const NAV_LINKS = [
  { href: '/clube', label: 'INÍCIO', icon: HomeIcon },
  { href: '/rifas', label: 'SORTEIOS', icon: TicketIcon },
]

const NAV_LINKS_RIGHT = [
  { href: '/lojas', label: 'LOJAS', icon: StoreIcon },
  { href: '/perfil', label: 'PERFIL', icon: UserIcon },
]

export function BottomNav() {
  const pathname = usePathname()

  function linkClass(href: string) {
    const isActive = pathname.startsWith(href)
    return `flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? 'text-brand-rust' : 'text-brand-sand/70'}`
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-brand-sand/10 bg-brand-dark px-2 py-3">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={linkClass(href)}>
          <Icon width={20} height={20} />
          <span className="text-[10px] tracking-wide">{label}</span>
        </Link>
      ))}

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

      {NAV_LINKS_RIGHT.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={linkClass(href)}>
          <Icon width={20} height={20} />
          <span className="text-[10px] tracking-wide">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
