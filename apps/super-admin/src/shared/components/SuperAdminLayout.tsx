'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/lojistas', label: 'Lojistas' },
  { href: '/planos', label: 'Planos SaaS' },
  { href: '/financeiro', label: 'Financeiro Global' },
  { href: '/configuracoes', label: 'Configurações' },
]

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-shrink-0 flex-col gap-1 border-r border-slate-200 p-4">
        <span className="mb-4 text-lg font-bold">Super Admin</span>
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm ${
                active
                  ? 'bg-slate-900 font-medium text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </aside>
      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  )
}
