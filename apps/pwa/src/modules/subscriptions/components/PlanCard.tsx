'use client'

import type { Plan } from '@clube/shared-types'
import { Button, Input } from '@clube/ui'
import { useState } from 'react'
import { useCheckout } from '../hooks/useCheckout'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function PlanCard({ plan }: { plan: Plan }) {
  const [name, setName] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const checkout = useCheckout()

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-brand-ink/15 p-6">
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className="text-2xl font-bold">
        {formatPrice(plan.priceCents)}
        <span className="text-sm font-normal text-brand-ink/80">/mês</span>
      </p>

      <Input
        placeholder="Nome completo"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Input
        placeholder="CPF ou CNPJ"
        value={cpfCnpj}
        onChange={(event) => setCpfCnpj(event.target.value)}
      />

      <Button
        disabled={checkout.isPending || !name || !cpfCnpj}
        onClick={() => checkout.mutate({ planId: plan.id, name, cpfCnpj })}
      >
        {checkout.isPending ? 'Processando...' : 'Assinar'}
      </Button>

      {checkout.isError && (
        <p className="text-sm text-red-600">Erro ao processar assinatura.</p>
      )}
    </div>
  )
}
