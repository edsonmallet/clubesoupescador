import type { Topic } from '@clube/shared-types'
import Link from 'next/link'
import { AuthorBadge } from './AuthorBadge'
import { ReactionBar } from './ReactionBar'
import { VoteButtons } from './VoteButtons'

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 p-3">
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
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
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
        <p className="line-clamp-2 text-sm text-slate-600">{topic.body}</p>

        <div className="mt-1 flex items-center justify-between">
          <ReactionBar
            targetType="topic"
            targetId={topic.id}
            counts={{}}
            myReactions={[]}
          />
          <Link
            href={`/comunidade/topico/${topic.id}`}
            className="text-xs text-slate-500"
          >
            {topic.commentCount} comentários
          </Link>
        </div>
      </div>
    </div>
  )
}
