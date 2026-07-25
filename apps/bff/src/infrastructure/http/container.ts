import { createTenantAuthPreHandler } from '@clube/fastify-plugins'
import { db } from '../db'
import { TenantRepository } from '../db/repositories/tenant.repository'
import { createResolveTenant } from './proxy'

const tenantRepository = new TenantRepository(db)

export const tenantAuthPreHandler = createTenantAuthPreHandler(
  createResolveTenant(tenantRepository),
)
