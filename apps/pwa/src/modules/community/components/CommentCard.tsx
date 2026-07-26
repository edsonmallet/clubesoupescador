'use client'

import type { CommunityComment } from '@clube/shared-types'
import { Button } from '@clube/ui'
import { useState } from 'react'
import { useCreateComment } from '../hooks/useCreateComment'
import { AuthorBadge } from './AuthorBadge'
import { VoteButtons } from './VoteButtons'

export function CommentCard({
  comment,
  replies,
  topicId,
}: {
  comment: CommunityComment
  replies: CommunityComment[]
  topicId: string
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const createComment = useCreateComment(topicId)

  const canReply = comment.depth === 0

  return (
    <div className="flex gap-2">
      <VoteButtons
        targetType="comment"
        targetId={comment.id}
        topicId={topicId}
        score={comment.voteScore}
      />

      <div className="flex flex-1 flex-col gap-1">
        <AuthorBadge authorUid={comment.authorUid} />
        <p className="text-sm">
          {comment.deleted ? (
            <em className="text-slate-400">[removido]</em>
          ) : (
            comment.body
          )}
        </p>

        {canReply && (
          <button
            type="button"
            onClick={() => setShowReply((v) => !v)}
            className="w-fit text-xs text-slate-500 hover:underline"
          >
            Responder
          </button>
        )}

        {showReply && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              createComment.mutate(
                { parentId: comment.id, body: replyBody },
                { onSuccess: () => setReplyBody('') },
              )
              setShowReply(false)
            }}
            className="flex flex-col gap-2"
          >
            <textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={2}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              placeholder="Escreva uma resposta..."
            />
            <Button type="submit" size="sm" disabled={!replyBody}>
              Responder
            </Button>
          </form>
        )}

        {replies.length > 0 && (
          <div className="mt-2 flex flex-col gap-3 border-l border-slate-200 pl-3">
            {replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                replies={[]}
                topicId={topicId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
