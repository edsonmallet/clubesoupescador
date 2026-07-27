'use client'

import Link from 'next/link'
import { useTenants } from '../hooks/useTenants'

export function TenantTable() {
  const { data, isLoading, isError } = useTenants()

  if (isLoading) return <p>Carregando lojistas...</p>
  if (isError) return <p>Erro ao carregar lojistas.</p>

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="py-2">Loja</th>
          <th className="py-2">Status</th>
          <th className="py-2">Plano</th>
          <th className="py-2">Membros</th>
          <th className="py-2">Receita</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map(({ tenant, memberCount }) => (
          <tr key={tenant.id} className="border-b border-slate-100">
            <td className="py-2">
              <Link href={`/lojistas/${tenant.id}`} className="hover:underline">
                {tenant.name}
              </Link>
              <span className="ml-2 text-xs text-slate-500">{tenant.slug}</span>
            </td>
            <td className="py-2">{tenant.status}</td>
            <td className="py-2">{tenant.planId ?? '-'}</td>
            <td className="py-2">{memberCount}</td>
            <td className="py-2" title="Disponível na Fase B">
              —
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
