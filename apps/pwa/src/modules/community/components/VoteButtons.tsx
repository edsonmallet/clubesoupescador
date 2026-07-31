'use client'

import { useState } from 'react'
import { useVote } from '../hooks/useVote'

export function VoteButtons({
  targetType,
  targetId,
  topicId,
  score,
}: {
  targetType: 'topic' | 'comment'
  targetId: string
  topicId?: string
  score: number
}) {
  const vote = useVote(targetType, targetId, topicId)
  const [active, setActive] = useState<1 | -1 | null>(null)
  const [localDelta, setLocalDelta] = useState(0)

  const handleVote = (value: 1 | -1) => {
    vote.mutate(value)
    setLocalDelta((current) => {
      if (active === value) return current - value // cancel
      if (active === null) return current + value // new vote
      return current + value * 2 // switched direction
    })
    setActive((current) => (current === value ? null : value))
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        aria-label="Upvote"
        onClick={() => handleVote(1)}
        className={`text-lg leading-none ${active === 1 ? 'text-brand-rust' : 'text-brand-ink/40 hover:text-brand-ink/80'}`}
      >
        ▲
      </button>
      <span className="text-sm font-semibold text-brand-ink">
        {score + localDelta}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        onClick={() => handleVote(-1)}
        className={`text-lg leading-none ${active === -1 ? 'text-brand-dark' : 'text-brand-ink/40 hover:text-brand-ink/80'}`}
      >
        ▼
      </button>
    </div>
  )
}
