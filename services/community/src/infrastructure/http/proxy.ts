import {
  createFirebaseAuthPreHandler,
  requireAuth,
  requireOwner,
  requireSubscriber,
} from '@clube/fastify-plugins'

export const communityAuthPreHandler = createFirebaseAuthPreHandler()

export { requireAuth, requireOwner, requireSubscriber }
