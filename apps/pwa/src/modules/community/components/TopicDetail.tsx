'use client'

import { Button } from '@clube/ui'
import { useState } from 'react'
import { useCreateComment } from '../hooks/useCreateComment'
import { useTopic } from '../hooks/useTopic'
import { AuthorBadge } from './AuthorBadge'
import { CommentCard } from './CommentCard'
import { ReactionBar } from './ReactionBar'
import { VoteButtons } from './VoteButtons'

export function TopicDetail({ topicId }: { topicId: string }) {
  const { data, isLoading } = useTopic(topicId)
  const createComment = useCreateComment(topicId)
  const [body, setBody] = useState('')

  if (isLoading || !data) return <p>Carregando...</p>

  const { topic, comments, reactionCounts, myReactions } = data
  const rootComments = comments.filter((comment) => comment.depth === 0)
  const repliesByParent = new Map<string, typeof comments>()
  for (const comment of comments) {
    if (comment.parentId) {
      const list = repliesByParent.get(comment.parentId) ?? []
      list.push(comment)
      repliesByParent.set(comment.parentId, list)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <VoteButtons
          targetType="topic"
          targetId={topic.id}
          score={topic.voteScore}
        />
        <div className="flex flex-1 flex-col gap-2">
          <AuthorBadge authorUid={topic.authorUid} />
          <h1 className="text-xl font-bold">{topic.title}</h1>
          <p className="whitespace-pre-wrap text-brand-ink">{topic.body}</p>
          <ReactionBar
            targetType="topic"
            targetId={topic.id}
            counts={reactionCounts}
            myReactions={myReactions}
          />
        </div>
      </div>

      {!topic.locked ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            createComment.mutate(
              { parentId: null, body },
              { onSuccess: () => setBody('') },
            )
          }}
          className="flex flex-col gap-2"
        >
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            className="rounded-md border border-brand-ink/25 px-3 py-2 text-sm"
            placeholder="Escreva um comentário..."
          />
          <Button type="submit" disabled={!body || createComment.isPending}>
            {createComment.isPending ? 'Enviando...' : 'Comentar'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-brand-ink/60">
          Tópico trancado — novos comentários desabilitados.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {rootComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            replies={repliesByParent.get(comment.id) ?? []}
            topicId={topicId}
          />
        ))}
      </div>
    </div>
  )
}
