import {
  createFirebaseAuthPreHandler,
  requireAuth,
  requireOwner,
  requireSubscriber,
} from '@clube/fastify-plugins'

export const storeAuthPreHandler = createFirebaseAuthPreHandler()

export { requireAuth, requireOwner, requireSubscriber }
