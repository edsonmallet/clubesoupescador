'use client'

import type { Domain } from '@clube/shared-types'
import { Button, Input } from '@clube/ui'
import { useEffect, useState } from 'react'
import { useAddDomain } from '../hooks/useAddDomain'
import { useDomains } from '../hooks/useDomains'
import { useVerifyDomain } from '../hooks/useVerifyDomain'

const POLL_INTERVAL_MS = 30_000

function statusLabel(domain: Domain): string {
  if (domain.verified) return 'Ativo'
  if (domain.lastError) return 'Erro'
  return 'Verificando'
}

function statusColor(domain: Domain): string {
  if (domain.verified) return 'text-emerald-600'
  if (domain.lastError) return 'text-red-600'
  return 'text-amber-600'
}

export function DomainManager() {
  const { data: domains, isLoading } = useDomains()
  const addDomain = useAddDomain()
  const verifyDomain = useVerifyDomain()
  const [newDomain, setNewDomain] = useState('')

  // biome-ignore lint/correctness/useExhaustiveDependencies: verifyDomain comes from useMutation and is recreated each render; including it would restart the interval every poll instead of every 30s
  useEffect(() => {
    const pending = domains?.filter((domain) => !domain.verified) ?? []
    if (pending.length === 0) return

    const interval = setInterval(() => {
      for (const domain of pending) {
        verifyDomain.mutate(domain.id)
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [domains])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-medium">Como apontar seu domínio</p>
        <p className="text-slate-600">
          Crie um registro CNAME apontando para <code>proxy.clube.com.br</code>.
          A verificação roda automaticamente a cada 30s enquanto pendente.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="loja.exemplo.com.br"
          value={newDomain}
          onChange={(event) => setNewDomain(event.target.value)}
        />
        <Button
          disabled={addDomain.isPending || !newDomain}
          onClick={() => {
            addDomain.mutate(newDomain, { onSuccess: () => setNewDomain('') })
          }}
        >
          Adicionar domínio
        </Button>
      </div>

      {isLoading ? (
        <p>Carregando domínios...</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="py-2">Domínio</th>
              <th className="py-2">Status</th>
              <th className="py-2">Ação</th>
            </tr>
          </thead>
          <tbody>
            {domains?.map((domain) => (
              <tr key={domain.id} className="border-b border-slate-100">
                <td className="py-2">{domain.domain}</td>
                <td className={`py-2 font-medium ${statusColor(domain)}`}>
                  {statusLabel(domain)}
                </td>
                <td className="py-2">
                  {!domain.verified && (
                    <Button
                      size="sm"
                      disabled={verifyDomain.isPending}
                      onClick={() => verifyDomain.mutate(domain.id)}
                    >
                      Verificar agora
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
