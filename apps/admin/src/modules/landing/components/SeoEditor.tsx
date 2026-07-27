'use client'

import type { LandingSeo } from '@clube/shared-types'
import { Input } from '@clube/ui'

export function SeoEditor({
  value,
  onChange,
}: {
  value: LandingSeo
  onChange: (value: LandingSeo) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="seo-title" className="text-sm font-medium">
          Título (SEO)
        </label>
        <Input
          id="seo-title"
          value={value.title ?? ''}
          onChange={(event) =>
            onChange({ ...value, title: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="seo-description" className="text-sm font-medium">
          Descrição (SEO)
        </label>
        <textarea
          id="seo-description"
          rows={3}
          value={value.description ?? ''}
          onChange={(event) =>
            onChange({ ...value, description: event.target.value })
          }
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="seo-og" className="text-sm font-medium">
          Imagem OG (URL)
        </label>
        <Input
          id="seo-og"
          value={value.ogImage ?? ''}
          onChange={(event) =>
            onChange({ ...value, ogImage: event.target.value })
          }
        />
      </div>
    </div>
  )
}
