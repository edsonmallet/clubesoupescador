'use client'

import type {
  LandingBenefitItem,
  LandingBenefitsSection,
} from '@clube/shared-types'
import { Button, Input } from '@clube/ui'

const EMPTY_ITEM: LandingBenefitItem = { icon: '', title: '', text: '' }

export function BenefitsEditor({
  value,
  onChange,
}: {
  value: LandingBenefitsSection
  onChange: (value: LandingBenefitsSection) => void
}) {
  const items = value.items ?? []

  const updateItem = (index: number, item: LandingBenefitItem) => {
    const next = [...items]
    next[index] = item
    onChange({ items: next })
  }

  const removeItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: benefit items have no stable id
          key={index}
          className="flex flex-col gap-2 rounded-md border border-slate-200 p-3"
        >
          <Input
            placeholder="Ícone"
            value={item.icon}
            onChange={(event) =>
              updateItem(index, { ...item, icon: event.target.value })
            }
          />
          <Input
            placeholder="Título"
            value={item.title}
            onChange={(event) =>
              updateItem(index, { ...item, title: event.target.value })
            }
          />
          <Input
            placeholder="Texto"
            value={item.text}
            onChange={(event) =>
              updateItem(index, { ...item, text: event.target.value })
            }
          />
          <Button size="sm" variant="outline" onClick={() => removeItem(index)}>
            Remover
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        onClick={() => onChange({ items: [...items, EMPTY_ITEM] })}
      >
        Adicionar benefício
      </Button>
    </div>
  )
}
