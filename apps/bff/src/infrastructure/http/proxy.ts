import {
  type Tenant,
  createTenantAuthPreHandler,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
} from '@clube/fastify-plugins'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'
import { db } from '../db'
import { TenantRepository } from '../db/repositories/tenant.repository'

export function createResolveTenant(repository: ITenantRepository) {
  return async function resolveTenant(domain: string): Promise<Tenant | null> {
    const slug = domain.endsWith('.clube.com.br')
      ? domain.replace('.clube.com.br', '')
      : domain

    const tenant =
      (await repository.findBySlug(slug)) ??
      (await repository.findByDomain(domain))

    return tenant ? { id: tenant.id, slug: tenant.slug } : null
  }
}

const tenantRepository = new TenantRepository(db)

export const tenantAuthPreHandler = createTenantAuthPreHandler(
  createResolveTenant(tenantRepository),
)

export {
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
}
