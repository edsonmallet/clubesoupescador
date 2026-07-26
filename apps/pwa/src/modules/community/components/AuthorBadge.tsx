'use client'

import { useMySubscription } from '@/modules/subscriptions/hooks/useMySubscription'
import { useAuthStore } from '@/shared/store/auth.store'

/**
 * Community only stores `authorUid` on posts — no directory of other
 * members' level/XP exists anywhere in this codebase to enrich arbitrary
 * authors with. This shows the real level/XP flair only when the post is
 * the current user's own; for everyone else it falls back to a generic
 * member badge rather than fabricating data.
 */
export function AuthorBadge({ authorUid }: { authorUid: string }) {
  const currentUid = useAuthStore((state) => state.uid)
  const isSelf = authorUid === currentUid
  const { data: subscription } = useMySubscription({ enabled: isSelf })

  const shortUid = `u/${authorUid.slice(0, 8)}`

  if (isSelf && subscription) {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{shortUid}</span>
        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800">
          {subscription.totalXp} XP
        </span>
      </span>
    )
  }

  return <span className="text-xs text-slate-500">{shortUid}</span>
}
