'use client'

import { useProfile } from '../hooks/useProfile'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || 'P'
}

export function ProfileHeader() {
  const { data: stats, isLoading, name, email } = useProfile()

  const progress =
    stats && stats.nextLevelXp > 0
      ? Math.min(100, Math.round((stats.currentXp / stats.nextLevelXp) * 100))
      : 0

  return (
    <div className="flex flex-col items-center gap-3 bg-brand-dark px-4 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-sand font-heading text-2xl text-brand-dark">
        {getInitials(name)}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-heading text-xl tracking-wide text-brand-sand">
          {name}
        </span>
        {email && <span className="text-sm text-brand-sand/70">{email}</span>}
      </div>

      {!isLoading && stats && (
        <div className="flex w-full max-w-xs flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-brand-sand/80">
            <span className="font-semibold text-brand-rust">
              {stats.levelName}
            </span>
            <span>
              {stats.currentXp} / {stats.nextLevelXp} XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-sand/20">
            <div
              className="h-full rounded-full bg-brand-rust"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
