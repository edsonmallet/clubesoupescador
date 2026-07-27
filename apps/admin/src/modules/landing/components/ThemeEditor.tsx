'use client'

import type { LandingTheme } from '@clube/shared-types'
import { Input } from '@clube/ui'

export function ThemeEditor({
  value,
  onChange,
}: {
  value: LandingTheme
  onChange: (value: LandingTheme) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="theme-primary" className="text-sm font-medium">
          Cor primária
        </label>
        <Input
          id="theme-primary"
          type="color"
          value={value.primary ?? '#000000'}
          onChange={(event) =>
            onChange({ ...value, primary: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="theme-secondary" className="text-sm font-medium">
          Cor secundária
        </label>
        <Input
          id="theme-secondary"
          type="color"
          value={value.secondary ?? '#000000'}
          onChange={(event) =>
            onChange({ ...value, secondary: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="theme-font" className="text-sm font-medium">
          Fonte
        </label>
        <select
          id="theme-font"
          value={value.font ?? 'Inter'}
          onChange={(event) => onChange({ ...value, font: event.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="Inter">Inter</option>
          <option value="Poppins">Poppins</option>
          <option value="Roboto">Roboto</option>
        </select>
      </div>
    </div>
  )
}
