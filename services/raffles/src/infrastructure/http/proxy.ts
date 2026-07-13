import {
  type Tenant,
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
} from '@clube/fastify-plugins'

async function resolveTenant(_domain: string): Promise<Tenant | null> {
  // TODO Fase 1: consultar o schema tenants no banco.
  return null
}

export const tenantAuthPreHandler = createTenantAuthPreHandler(resolveTenant)

export {
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
}
