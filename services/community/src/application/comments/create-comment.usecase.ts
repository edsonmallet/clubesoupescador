import type { Comment } from '../../domain/entities/Comment'
import {
  CommentNotFoundError,
  MaxThreadingDepthError,
  TopicLockedError,
  TopicNotFoundError,
} from '../../domain/errors'
import type { ICommentRepository } from '../../domain/interfaces/ICommentRepository'
import type { ITopicRepository } from '../../domain/interfaces/ITopicRepository'

const COMMENT_CREATED_XP = 5
const MAX_DEPTH = 1 // depth 0 (top-level) and 1 (one reply level) — 2 levels total.

export type CreateCommentInput = {
  tenantId: string
  topicId: string
  authorUid: string
  parentId: string | null
  body: string
}

export type EnqueueGrantXp = (data: {
  tenantId: string
  uid: string
  amount: number
  source: string
}) => Promise<void>

export class CreateCommentUseCase {
  constructor(
    private readonly topicRepository: ITopicRepository,
    private readonly commentRepository: ICommentRepository,
    private readonly enqueueGrantXp: EnqueueGrantXp,
  ) {}

  async execute(input: CreateCommentInput): Promise<Comment> {
    const topic = await this.topicRepository.findById(
      input.tenantId,
      input.topicId,
    )
    if (!topic) throw new TopicNotFoundError(input.topicId)
    if (topic.locked) throw new TopicLockedError(topic.id)

    let depth = 0
    if (input.parentId) {
      const parent = await this.commentRepository.findById(
        input.tenantId,
        input.parentId,
      )
      if (!parent) throw new CommentNotFoundError(input.parentId)
      if (parent.depth >= MAX_DEPTH) throw new MaxThreadingDepthError()
      depth = parent.depth + 1
    }

    const comment = await this.commentRepository.create({
      tenantId: input.tenantId,
      topicId: input.topicId,
      authorUid: input.authorUid,
      parentId: input.parentId,
      depth,
      body: input.body,
    })

    await this.topicRepository.incrementCommentCount(topic.id, 1)

    await this.enqueueGrantXp({
      tenantId: input.tenantId,
      uid: input.authorUid,
      amount: COMMENT_CREATED_XP,
      source: 'community_comment',
    })

    return comment
  }
}
