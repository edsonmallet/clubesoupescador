'use client'

import { useState } from 'react'
import { CashbackConfigTable } from './CashbackConfigTable'
import { LevelConfigTable } from './LevelConfigTable'
import { XpConfigTable } from './XpConfigTable'

const TABS = [
  { value: 'xp', label: 'XP' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'levels', label: 'Níveis' },
] as const

export function SettingsTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>('xp')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              tab === t.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'xp' && <XpConfigTable />}
      {tab === 'cashback' && <CashbackConfigTable />}
      {tab === 'levels' && <LevelConfigTable />}
    </div>
  )
}
