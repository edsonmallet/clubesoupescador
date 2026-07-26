import {
  createFirebaseAuthPreHandler,
  requireAuth,
  requireOwner,
  requireSubscriber,
} from '@clube/fastify-plugins'

export const rafflesAuthPreHandler = createFirebaseAuthPreHandler()

export { requireAuth, requireOwner, requireSubscriber }
