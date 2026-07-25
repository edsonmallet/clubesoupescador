import {
  type Tenant,
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
} from '@clube/fastify-plugins'
import type { ITenantRepository } from '../../domain/interfaces/ITenantRepository'

export function createResolveTenant(repository: ITenantRepository) {
  return async function resolveTenant(domain: string): Promise<Tenant | null> {
    const slug = domain.endsWith('.clube.com.br')
      ? domain.slice(0, -'.clube.com.br'.length)
      : domain

    const tenant =
      (await repository.findBySlug(slug)) ??
      (await repository.findByDomain(domain))

    if (!tenant || tenant.status !== 'active') {
      return null
    }

    return { id: tenant.id, slug: tenant.slug }
  }
}

export {
  requireAuth,
  requireManager,
  requireOwner,
  requireSubscriber,
  requireSuperAdmin,
}
