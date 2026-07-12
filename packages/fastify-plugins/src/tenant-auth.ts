import type { Role } from '@clube/shared-types'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getAuth } from 'firebase-admin/auth'

export type Tenant = {
  id: string
  slug: string
}

export type ResolveTenant = (domain: string) => Promise<Tenant | null>

export type AuthenticatedUser = {
  uid: string
  role: Role
  tenant_id: string | null
}

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: Tenant | null
    user?: AuthenticatedUser
  }
}

export function createTenantAuthPreHandler(resolveTenant: ResolveTenant) {
  return async function tenantAuthPreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const host = request.headers.host ?? ''
    const domain = host.replace('www.', '').split(':')[0]

    const tenant = await resolveTenant(domain)
    if (!tenant) {
      reply.status(404).send({ error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } })
      return
    }
    request.tenant = tenant

    const token = request.headers.authorization?.split('Bearer ')[1]
    if (token) {
      const decoded = await getAuth().verifyIdToken(token)
      request.user = {
        uid: decoded.uid,
        role: (decoded.role as Role) ?? 'user',
        tenant_id: (decoded.tenant_id as string) ?? null,
      }
    }
  }
}
