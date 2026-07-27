'use client'

import type { LandingConfig } from '@clube/shared-types'

export function LandingPreview({ config }: { config: LandingConfig }) {
  const { theme, sections } = config
  const primary = theme.primary || '#0f172a'
  const secondary = theme.secondary || '#f1f5f9'

  return (
    <div
      className="flex flex-col gap-6 rounded-md border border-slate-200 p-4"
      style={{ fontFamily: theme.font || 'Inter' }}
    >
      <section
        className="rounded-md p-8 text-center text-white"
        style={{ backgroundColor: primary }}
      >
        <h2 className="text-2xl font-bold">
          {sections.hero?.title || 'Título da landing'}
        </h2>
        <p className="mt-2">{sections.hero?.subtitle || 'Subtítulo'}</p>
        <button
          type="button"
          className="mt-4 rounded-md px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: secondary, color: primary }}
        >
          {sections.hero?.ctaText || 'Assinar agora'}
        </button>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(sections.benefits?.items ?? []).map((item, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: preview-only render
            key={index}
            className="rounded-md border border-slate-200 p-3 text-center text-sm"
          >
            <p className="text-xl">{item.icon}</p>
            <p className="font-medium">{item.title}</p>
            <p className="text-slate-600">{item.text}</p>
          </div>
        ))}
      </section>

      {sections.plan && (
        <section className="rounded-md border border-slate-200 p-4 text-center">
          <p className="text-lg font-bold">
            {sections.plan.price
              ? `R$ ${sections.plan.price.toFixed(2)}/mês`
              : 'Preço do plano'}
          </p>
          <ul className="mt-2 text-sm text-slate-600">
            {(sections.plan.benefits ?? []).map((benefit, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: preview-only render
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
