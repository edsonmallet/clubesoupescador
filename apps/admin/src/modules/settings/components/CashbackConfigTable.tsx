'use client'

import type { CashbackConfigItem } from '@clube/shared-types'
import { Button, Input } from '@clube/ui'
import { useState } from 'react'
import { useCashbackConfig, useUpdateCashbackConfig } from '../hooks/useCashbackConfig'

function ConfigRow({ config }: { config: CashbackConfigItem }) {
  const [pct, setPct] = useState(String(config.pct))
  const [expiryMonths, setExpiryMonths] = useState(String(config.expiryMonths))
  const update = useUpdateCashbackConfig()

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2">{config.source}</td>
      <td className="py-2">
        <Input
          type="number"
          step="0.1"
          value={pct}
          onChange={(event) => setPct(event.target.value)}
          className="w-20"
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          value={expiryMonths}
          onChange={(event) => setExpiryMonths(event.target.value)}
          className="w-20"
        />
      </td>
      <td className="py-2">
        <Button
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              source: config.source,
              pct: Number(pct),
              expiryMonths: Number(expiryMonths),
            })
          }
        >
          Salvar
        </Button>
      </td>
    </tr>
  )
}

function NewSourceRow() {
  const [source, setSource] = useState('')
  const [pct, setPct] = useState('')
  const [expiryMonths, setExpiryMonths] = useState('12')
  const update = useUpdateCashbackConfig()

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2">
        <Input
          placeholder="fonte (ex: earned_purchase)"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          step="0.1"
          value={pct}
          onChange={(event) => setPct(event.target.value)}
          className="w-20"
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          value={expiryMonths}
          onChange={(event) => setExpiryMonths(event.target.value)}
          className="w-20"
        />
      </td>
      <td className="py-2">
        <Button
          size="sm"
          variant="outline"
          disabled={update.isPending || !source || !pct}
          onClick={() => {
            update.mutate({ source, pct: Number(pct), expiryMonths: Number(expiryMonths) })
            setSource('')
            setPct('')
          }}
        >
          Adicionar
        </Button>
      </td>
    </tr>
  )
}

export function CashbackConfigTable() {
  const { data, isLoading } = useCashbackConfig()

  if (isLoading) return <p>Carregando...</p>

  return (
    <table className="w-full max-w-2xl border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="py-2">Fonte</th>
          <th className="py-2">%</th>
          <th className="py-2">Validade (meses)</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {data?.map((config) => (
          <ConfigRow key={config.source} config={config} />
        ))}
        <NewSourceRow />
      </tbody>
    </table>
  )
}
