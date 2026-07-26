'use client'

import { useReaction } from '../hooks/useReaction'

const ALLOWED_EMOJIS = ['👍', '🔥', '😂', '😮', '🤔']

export function ReactionBar({
  targetType,
  targetId,
  topicId,
  counts,
  myReactions,
}: {
  targetType: 'topic' | 'comment'
  targetId: string
  topicId?: string
  counts: Record<string, number>
  myReactions: string[]
}) {
  const react = useReaction(targetType, targetId, topicId)

  return (
    <div className="flex flex-wrap gap-1">
      {ALLOWED_EMOJIS.map((emoji) => {
        const active = myReactions.includes(emoji)
        const count = counts[emoji] ?? 0
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => react.mutate(emoji)}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
              active
                ? 'border-orange-400 bg-orange-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-slate-600">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
