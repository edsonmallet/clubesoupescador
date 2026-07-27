import {
  createFirebaseAuthPreHandler,
  requireAuth,
  requireOwner,
  requireSubscriber,
} from '@clube/fastify-plugins'

export const subscriptionsAuthPreHandler = createFirebaseAuthPreHandler()

export { requireAuth, requireOwner, requireSubscriber }
