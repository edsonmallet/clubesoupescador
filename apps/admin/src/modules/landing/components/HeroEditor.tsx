'use client'

import type { LandingHeroSection } from '@clube/shared-types'
import { Input } from '@clube/ui'

export function HeroEditor({
  value,
  onChange,
}: {
  value: LandingHeroSection
  onChange: (value: LandingHeroSection) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="hero-title" className="text-sm font-medium">
          Título
        </label>
        <Input
          id="hero-title"
          value={value.title ?? ''}
          onChange={(event) =>
            onChange({ ...value, title: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="hero-subtitle" className="text-sm font-medium">
          Subtítulo
        </label>
        <Input
          id="hero-subtitle"
          value={value.subtitle ?? ''}
          onChange={(event) =>
            onChange({ ...value, subtitle: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="hero-bg" className="text-sm font-medium">
          Imagem de fundo (URL)
        </label>
        <Input
          id="hero-bg"
          value={value.bgImage ?? ''}
          onChange={(event) =>
            onChange({ ...value, bgImage: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="hero-cta" className="text-sm font-medium">
          Texto do botão
        </label>
        <Input
          id="hero-cta"
          value={value.ctaText ?? ''}
          onChange={(event) =>
            onChange({ ...value, ctaText: event.target.value })
          }
        />
      </div>
    </div>
  )
}
