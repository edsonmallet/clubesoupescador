export { registerCors } from './cors'
export { registerHealth } from './health'
export { registerErrorHandler } from './error-handler'
export { registerScalar } from './scalar'
export { createTenantAuthPreHandler } from './tenant-auth'
export type { AuthenticatedUser, ResolveTenant, Tenant } from './tenant-auth'
export {
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
} from './guards'
