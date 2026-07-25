import {
  createFirebaseAuthPreHandler,
  requireAuth,
  requireSubscriber,
} from '@clube/fastify-plugins'

export const subscriptionsAuthPreHandler = createFirebaseAuthPreHandler()

export { requireAuth, requireSubscriber }
