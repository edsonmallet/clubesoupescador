import { CreateCommentUseCase } from '../../application/comments/create-comment.usecase'
import { ToggleReactionUseCase } from '../../application/reactions/toggle-reaction.usecase'
import { CreateReportUseCase } from '../../application/reports/create-report.usecase'
import { CreateTopicUseCase } from '../../application/topics/create-topic.usecase'
import { GetTopicUseCase } from '../../application/topics/get-topic.usecase'
import { ListTopicsUseCase } from '../../application/topics/list-topics.usecase'
import { ToggleVoteUseCase } from '../../application/votes/toggle-vote.usecase'
import { db } from '../db'
import { CategoryRepository } from '../db/repositories/category.repository'
import { CommentRepository } from '../db/repositories/comment.repository'
import { ReactionRepository } from '../db/repositories/reaction.repository'
import { ReportRepository } from '../db/repositories/report.repository'
import { TopicRepository } from '../db/repositories/topic.repository'
import { VoteRepository } from '../db/repositories/vote.repository'
import { enqueueGrantXp } from '../queue/cross-service.queue'
import {
  communityAuthPreHandler,
  requireAuth,
  requireOwner,
  requireSubscriber,
} from './proxy'

export const categoryRepository = new CategoryRepository(db)
export const topicRepository = new TopicRepository(db)
export const commentRepository = new CommentRepository(db)
export const reactionRepository = new ReactionRepository(db)
export const voteRepository = new VoteRepository(db)
export const reportRepository = new ReportRepository(db)

export const createTopicUseCase = new CreateTopicUseCase(
  topicRepository,
  categoryRepository,
  enqueueGrantXp,
)
export const listTopicsUseCase = new ListTopicsUseCase(topicRepository)
export const getTopicUseCase = new GetTopicUseCase(
  topicRepository,
  commentRepository,
  reactionRepository,
)
export const createCommentUseCase = new CreateCommentUseCase(
  topicRepository,
  commentRepository,
  enqueueGrantXp,
)
export const toggleReactionUseCase = new ToggleReactionUseCase(
  reactionRepository,
)
export const toggleVoteUseCase = new ToggleVoteUseCase(
  voteRepository,
  topicRepository,
  commentRepository,
)
export const createReportUseCase = new CreateReportUseCase(reportRepository)

export { communityAuthPreHandler, requireAuth, requireOwner, requireSubscriber }
