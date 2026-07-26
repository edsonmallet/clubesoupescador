import {
  createFirebaseAuthPreHandler,
  requireAuth,
  requireOwner,
} from '@clube/fastify-plugins'

export const cashbackAuthPreHandler = createFirebaseAuthPreHandler()

export { requireAuth, requireOwner }
