'use client'

import type { XpConfigItem } from '@clube/shared-types'
import { Button, Input } from '@clube/ui'
import { useState } from 'react'
import { useUpdateXpConfig, useXpConfig } from '../hooks/useXpConfig'

function ConfigRow({ config }: { config: XpConfigItem }) {
  const [points, setPoints] = useState(String(config.points))
  const [dailyCap, setDailyCap] = useState(config.dailyCap ? String(config.dailyCap) : '')
  const update = useUpdateXpConfig()

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2">{config.source}</td>
      <td className="py-2">
        <Input
          type="number"
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          className="w-24"
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          placeholder="ilimitado"
          value={dailyCap}
          onChange={(event) => setDailyCap(event.target.value)}
          className="w-28"
        />
      </td>
      <td className="py-2">
        <Button
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              source: config.source,
              points: Number(points),
              dailyCap: dailyCap ? Number(dailyCap) : null,
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
  const [points, setPoints] = useState('')
  const [dailyCap, setDailyCap] = useState('')
  const update = useUpdateXpConfig()

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2">
        <Input
          placeholder="fonte (ex: community_topic)"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          className="w-24"
        />
      </td>
      <td className="py-2">
        <Input
          type="number"
          placeholder="ilimitado"
          value={dailyCap}
          onChange={(event) => setDailyCap(event.target.value)}
          className="w-28"
        />
      </td>
      <td className="py-2">
        <Button
          size="sm"
          variant="outline"
          disabled={update.isPending || !source || !points}
          onClick={() => {
            update.mutate({
              source,
              points: Number(points),
              dailyCap: dailyCap ? Number(dailyCap) : null,
            })
            setSource('')
            setPoints('')
            setDailyCap('')
          }}
        >
          Adicionar
        </Button>
      </td>
    </tr>
  )
}

export function XpConfigTable() {
  const { data, isLoading } = useXpConfig()

  if (isLoading) return <p>Carregando...</p>

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-amber-700">
        Ainda não conectado aos pontos concedidos automaticamente pelos serviços (valores fixos
        no código) — só persiste a configuração.
      </p>
      <table className="w-full max-w-2xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="py-2">Fonte</th>
            <th className="py-2">Pontos</th>
            <th className="py-2">Limite diário</th>
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
    </div>
  )
}
