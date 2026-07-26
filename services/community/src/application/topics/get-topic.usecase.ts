import type { Comment } from '../../domain/entities/Comment'
import type { Topic } from '../../domain/entities/Topic'
import { TopicNotFoundError } from '../../domain/errors'
import type { ICommentRepository } from '../../domain/interfaces/ICommentRepository'
import type {
  Emoji,
  IReactionRepository,
  ReactionCounts,
} from '../../domain/interfaces/IReactionRepository'
import type { ITopicRepository } from '../../domain/interfaces/ITopicRepository'

export type GetTopicInput = {
  tenantId: string
  topicId: string
  uid: string | null
}

export type GetTopicOutput = {
  topic: Topic
  comments: Comment[]
  reactionCounts: ReactionCounts
  myReactions: Emoji[]
}

export class GetTopicUseCase {
  constructor(
    private readonly topicRepository: ITopicRepository,
    private readonly commentRepository: ICommentRepository,
    private readonly reactionRepository: IReactionRepository,
  ) {}

  async execute(input: GetTopicInput): Promise<GetTopicOutput> {
    const topic = await this.topicRepository.findById(
      input.tenantId,
      input.topicId,
    )
    if (!topic) throw new TopicNotFoundError(input.topicId)

    const [comments, reactionCounts, myReactions] = await Promise.all([
      this.commentRepository.findByTopic(input.tenantId, topic.id),
      this.reactionRepository.countsByTarget(input.tenantId, 'topic', topic.id),
      input.uid
        ? this.reactionRepository.findByUser(
            input.tenantId,
            'topic',
            topic.id,
            input.uid,
          )
        : Promise.resolve([]),
    ])

    return { topic, comments, reactionCounts, myReactions }
  }
}
