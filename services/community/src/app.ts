import {
  registerCors,
  registerErrorHandler,
  registerHealth,
  registerScalar,
} from '@clube/fastify-plugins'
import Fastify, { type FastifyInstance } from 'fastify'
import {
  categoryRepository,
  commentRepository,
  communityAuthPreHandler,
  createCommentUseCase,
  createReportUseCase,
  createTopicUseCase,
  getTopicUseCase,
  listTopicsUseCase,
  reportRepository,
  requireOwner,
  requireSubscriber,
  toggleReactionUseCase,
  toggleVoteUseCase,
  topicRepository,
} from './infrastructure/http/container'
import { registerCategoriesRoutes } from './infrastructure/http/routes/categories'
import { registerCommentsRoutes } from './infrastructure/http/routes/comments'
import { registerInternalRoutes } from './infrastructure/http/routes/internal'
import { registerReactionsRoutes } from './infrastructure/http/routes/reactions'
import { registerReportsRoutes } from './infrastructure/http/routes/reports'
import { registerTopicsRoutes } from './infrastructure/http/routes/topics'
import { registerVotesRoutes } from './infrastructure/http/routes/votes'

export async function buildApp(
  opts: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true })

  await registerCors(app)
  await registerErrorHandler(app)
  await registerScalar(app, 'Clube Community')
  await registerHealth(app)
  await registerCategoriesRoutes(app, {
    communityAuthPreHandler,
    requireOwner,
    categoryRepository,
  })
  await registerTopicsRoutes(app, {
    communityAuthPreHandler,
    requireSubscriber,
    requireOwner,
    createTopicUseCase,
    listTopicsUseCase,
    getTopicUseCase,
    topicRepository,
  })
  await registerCommentsRoutes(app, {
    communityAuthPreHandler,
    requireSubscriber,
    requireOwner,
    createCommentUseCase,
    commentRepository,
  })
  await registerVotesRoutes(app, {
    communityAuthPreHandler,
    requireSubscriber,
    toggleVoteUseCase,
  })
  await registerReactionsRoutes(app, {
    communityAuthPreHandler,
    requireSubscriber,
    toggleReactionUseCase,
  })
  await registerReportsRoutes(app, {
    communityAuthPreHandler,
    requireSubscriber,
    requireOwner,
    createReportUseCase,
    reportRepository,
  })
  await registerInternalRoutes(app, { categoryRepository, topicRepository })

  return app
}
