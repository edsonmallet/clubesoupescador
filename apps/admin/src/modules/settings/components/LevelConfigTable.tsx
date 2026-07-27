'use client'

import type { Level } from '@clube/shared-types'
import { Button, Input } from '@clube/ui'
import { useState } from 'react'
import { useLevels, useUpdateLevel } from '../hooks/useLevels'

function LevelRow({ level }: { level: Level }) {
  const [name, setName] = useState(level.name)
  const [minXp, setMinXp] = useState(String(level.minXp))
  const [storeDiscountPct, setStoreDiscountPct] = useState(String(level.storeDiscountPct))
  const [cashbackPct, setCashbackPct] = useState(String(level.cashbackPct))
  const update = useUpdateLevel()

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2">
        <Input value={name} onChange={(event) => setName(event.target.value)} className="w-28" />
      </td>
      <td className="py-2">
        <Input
          type="number"
          value={minXp}
          onChange={(event) => setMinXp(event.target.value)}
          className="w-24"
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          step="0.1"
          value={storeDiscountPct}
          onChange={(event) => setStoreDiscountPct(event.target.value)}
          className="w-20"
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          step="0.1"
          value={cashbackPct}
          onChange={(event) => setCashbackPct(event.target.value)}
          className="w-20"
        />
      </td>
      <td className="py-2">
        <Button
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              id: level.id,
              data: {
                name,
                minXp: Number(minXp),
                storeDiscountPct: Number(storeDiscountPct),
                cashbackPct: Number(cashbackPct),
              },
            })
          }
        >
          Salvar
        </Button>
      </td>
    </tr>
  )
}

export function LevelConfigTable() {
  const { data, isLoading } = useLevels()

  if (isLoading) return <p>Carregando...</p>

  if (!data?.length) {
    return <p className="text-sm text-slate-600">Nenhum nível cadastrado ainda.</p>
  }

  return (
    <table className="w-full max-w-2xl border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="py-2">Nome</th>
          <th className="py-2">XP mínimo</th>
          <th className="py-2">Desconto loja %</th>
          <th className="py-2">Cashback %</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {data.map((level) => (
          <LevelRow key={level.id} level={level} />
        ))}
      </tbody>
    </table>
  )
}
