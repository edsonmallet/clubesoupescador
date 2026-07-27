import {
  createFirebaseAuthPreHandler,
  requireOwner,
  requireSubscriber,
} from '@clube/fastify-plugins'

export const tournamentsAuthPreHandler = createFirebaseAuthPreHandler()

export { requireOwner, requireSubscriber }
