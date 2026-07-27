import {
  createFirebaseAuthPreHandler,
  requireOwner,
  requireSuperAdmin,
} from '@clube/fastify-plugins'

export const billingAuthPreHandler = createFirebaseAuthPreHandler()

export { requireOwner, requireSuperAdmin }
