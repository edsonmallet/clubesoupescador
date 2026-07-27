'use client'

import { zodResolver } from '@/shared/utils/zod-resolver'
import { Button, Input } from '@clube/ui'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCheckout } from '../hooks/useCheckout'
import { usePlans } from '../hooks/usePlans'
import {
  type CheckoutFormInput,
  checkoutSchema,
} from '../schemas/checkout.schema'
import type { SaasPlan } from '../types/billing'

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function CheckoutForm({ plan }: { plan: SaasPlan }) {
  const mutation = useCheckout()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: '', cpfCnpj: '' },
  })

  const onSubmit = handleSubmit((data) => {
    mutation.mutate({ planId: plan.id, ...data })
  })

  const paymentLinkMissing = mutation.isSuccess && !mutation.data?.paymentUrl

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 flex flex-col gap-3 rounded-md bg-slate-50 p-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`name-${plan.id}`} className="text-sm font-medium">
          Nome do responsável
        </label>
        <Input id={`name-${plan.id}`} {...register('name')} />
        {errors.name && (
          <span className="text-sm text-red-600">{errors.name.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`cpfCnpj-${plan.id}`} className="text-sm font-medium">
          CPF ou CNPJ
        </label>
        <Input id={`cpfCnpj-${plan.id}`} {...register('cpfCnpj')} />
        {errors.cpfCnpj && (
          <span className="text-sm text-red-600">{errors.cpfCnpj.message}</span>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">
          Não foi possível iniciar a assinatura. Tente novamente.
        </p>
      )}

      {paymentLinkMissing && (
        <p className="text-sm text-red-600">
          A assinatura foi criada, mas não foi possível gerar o link de
          pagamento. Acesse novamente esta página em instantes ou contate o
          suporte.
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="w-fit">
        {mutation.isPending ? 'Processando...' : 'Confirmar assinatura'}
      </Button>
    </form>
  )
}

export function PlanPicker() {
  const { data, isLoading, isError } = usePlans()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  if (isLoading) return <p>Carregando planos...</p>
  if (isError) return <p>Erro ao carregar planos.</p>

  const activePlans = (data ?? []).filter((plan) => plan.active)

  if (activePlans.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Nenhum plano disponível no momento.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {activePlans.map((plan) => (
        <div key={plan.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{plan.name}</p>
              <p className="text-sm text-slate-500">
                {formatPrice(plan.priceCents)}/mês
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setSelectedPlanId((current) =>
                  current === plan.id ? null : plan.id,
                )
              }
            >
              Assinar
            </Button>
          </div>

          {selectedPlanId === plan.id && <CheckoutForm plan={plan} />}
        </div>
      ))}
    </div>
  )
}
