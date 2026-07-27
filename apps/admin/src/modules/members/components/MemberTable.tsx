'use client'

import type { Member } from '@clube/shared-types'
import { Button } from '@clube/ui'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useAdminMembers } from '../hooks/useAdminMembers'
import { usePromoteMember } from '../hooks/usePromoteMember'

const STATUS_OPTIONS = ['all', 'active', 'inactive', 'overdue', 'cancelled']

export function MemberTable() {
  const { data, isLoading } = useAdminMembers()
  const promote = usePromoteMember()
  const [statusFilter, setStatusFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  const levels = useMemo(
    () => Array.from(new Set(data?.items.map((m) => m.levelId).filter(Boolean))),
    [data],
  )

  const filtered = (data?.items ?? []).filter((member: Member) => {
    if (statusFilter !== 'all' && member.status !== statusFilter) return false
    if (levelFilter !== 'all' && member.levelId !== levelFilter) return false
    return true
  })

  if (isLoading) return <p>Carregando membros...</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === 'all' ? 'Todos os status' : status}
            </option>
          ))}
        </select>

        <select
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="all">Todos os níveis</option>
          {levels.map((levelId) => (
            <option key={levelId} value={levelId as string}>
              {levelId}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="py-2">Membro</th>
            <th className="py-2">Status</th>
            <th className="py-2">XP</th>
            <th className="py-2">Desde</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((member) => (
            <tr key={member.id} className="border-b border-slate-100">
              <td className="py-2">
                <Link href={`/membros/${member.uid}`} className="hover:underline">
                  {member.uid.slice(0, 12)}
                </Link>
              </td>
              <td className="py-2">{member.status}</td>
              <td className="py-2">{member.totalXp}</td>
              <td className="py-2">{new Date(member.createdAt).toLocaleDateString('pt-BR')}</td>
              <td className="py-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={promote.isPending}
                  onClick={() => promote.mutate(member.uid)}
                >
                  Promover a mod
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
