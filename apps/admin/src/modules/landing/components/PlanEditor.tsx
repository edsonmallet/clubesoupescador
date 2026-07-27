'use client'

import type { LandingPlanSection } from '@clube/shared-types'
import { Button, Input } from '@clube/ui'

export function PlanEditor({
  value,
  onChange,
}: {
  value: LandingPlanSection
  onChange: (value: LandingPlanSection) => void
}) {
  const benefits = value.benefits ?? []

  const updateBenefit = (index: number, text: string) => {
    const next = [...benefits]
    next[index] = text
    onChange({ ...value, benefits: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="plan-price" className="text-sm font-medium">
          Preço mensal (R$)
        </label>
        <Input
          id="plan-price"
          type="number"
          step="0.01"
          value={value.price ?? ''}
          onChange={(event) =>
            onChange({ ...value, price: Number(event.target.value) })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Benefícios</span>
        {benefits.map((benefit, index) => (
          <Input
            // biome-ignore lint/suspicious/noArrayIndexKey: benefit list has no stable id
            key={index}
            value={benefit}
            onChange={(event) => updateBenefit(index, event.target.value)}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...value, benefits: [...benefits, ''] })}
        >
          Adicionar benefício
        </Button>
      </div>
    </div>
  )
}
