'use client'

import type { LandingConfig, LandingTemplateId } from '@clube/shared-types'
import { Button } from '@clube/ui'
import { useEffect, useState } from 'react'
import { useLandingConfig } from '../hooks/useLandingConfig'
import { useUpdateLandingConfig } from '../hooks/useUpdateLandingConfig'
import { BenefitsEditor } from './BenefitsEditor'
import { DomainManager } from './DomainManager'
import { HeroEditor } from './HeroEditor'
import { LandingPreview } from './LandingPreview'
import { PlanEditor } from './PlanEditor'
import { SeoEditor } from './SeoEditor'
import { ThemeEditor } from './ThemeEditor'

const TABS = ['Template', 'Tema', 'Seções', 'SEO', 'Domínio'] as const
type Tab = (typeof TABS)[number]

export function LandingEditor() {
  const { data: config, isLoading } = useLandingConfig()
  const update = useUpdateLandingConfig()
  const [tab, setTab] = useState<Tab>('Template')
  const [draft, setDraft] = useState<LandingConfig | null>(null)

  useEffect(() => {
    if (config && !draft) setDraft(config)
  }, [config, draft])

  if (isLoading || !draft) return <p>Carregando editor...</p>

  const save = () => update.mutate(draft)

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex gap-2 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium ${
                tab === t
                  ? 'border-b-2 border-slate-900 text-slate-900'
                  : 'text-slate-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Template' && (
          <div className="flex gap-4">
            {(['clube-simples', 'clube-premium'] as LandingTemplateId[]).map(
              (id) => (
                <label
                  key={id}
                  className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm"
                >
                  <input
                    type="radio"
                    name="templateId"
                    checked={draft.templateId === id}
                    onChange={() => setDraft({ ...draft, templateId: id })}
                  />
                  {id}
                </label>
              ),
            )}
          </div>
        )}

        {tab === 'Tema' && (
          <ThemeEditor
            value={draft.theme}
            onChange={(theme) => setDraft({ ...draft, theme })}
          />
        )}

        {tab === 'Seções' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Hero</h3>
              <HeroEditor
                value={draft.sections.hero ?? {}}
                onChange={(hero) =>
                  setDraft({ ...draft, sections: { ...draft.sections, hero } })
                }
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Benefícios</h3>
              <BenefitsEditor
                value={draft.sections.benefits ?? {}}
                onChange={(benefits) =>
                  setDraft({
                    ...draft,
                    sections: { ...draft.sections, benefits },
                  })
                }
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Plano</h3>
              <PlanEditor
                value={draft.sections.plan ?? {}}
                onChange={(plan) =>
                  setDraft({ ...draft, sections: { ...draft.sections, plan } })
                }
              />
            </div>
          </div>
        )}

        {tab === 'SEO' && (
          <SeoEditor
            value={draft.seo}
            onChange={(seo) => setDraft({ ...draft, seo })}
          />
        )}

        {tab === 'Domínio' && <DomainManager />}

        {tab !== 'Domínio' && (
          <div className="flex items-center gap-3">
            <Button disabled={update.isPending} onClick={save}>
              {update.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
            {update.isSuccess && (
              <span className="text-sm text-emerald-600">Salvo.</span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1">
        <p className="mb-2 text-xs text-slate-500">
          Pré-visualização aproximada — apps/landing ainda não consome esta
          configuração para renderizar o template real.
        </p>
        <LandingPreview config={draft} />
      </div>
    </div>
  )
}
