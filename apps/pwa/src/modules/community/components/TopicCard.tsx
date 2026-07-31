import type { Topic } from '@clube/shared-types'
import Link from 'next/link'
import { AuthorBadge } from './AuthorBadge'
import { ReactionBar } from './ReactionBar'
import { VoteButtons } from './VoteButtons'

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <div className="flex gap-3 rounded-lg border border-brand-ink/15 p-3">
      <VoteButtons
        targetType="topic"
        targetId={topic.id}
        score={topic.voteScore}
      />

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          {topic.pinned && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
              Fixado
            </span>
          )}
          {topic.locked && (
            <span className="rounded-full bg-brand-sand/60 px-2 py-0.5 text-xs text-brand-ink/80">
              Trancado
            </span>
          )}
          <AuthorBadge authorUid={topic.authorUid} />
        </div>

        <Link
          href={`/comunidade/topico/${topic.id}`}
          className="font-semibold hover:underline"
        >
          {topic.title}
        </Link>
        <p className="line-clamp-2 text-sm text-brand-ink/80">{topic.body}</p>

        <div className="mt-1 flex items-center justify-between">
          <ReactionBar
            targetType="topic"
            targetId={topic.id}
            counts={{}}
            myReactions={[]}
          />
          <Link
            href={`/comunidade/topico/${topic.id}`}
            className="text-xs text-brand-ink/60"
          >
            {topic.commentCount} comentários
          </Link>
        </div>
      </div>
    </div>
  )
}
