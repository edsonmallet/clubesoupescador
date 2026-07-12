import type { Role } from '@clube/shared-types'
import type { FastifyReply, FastifyRequest } from 'fastify'

function guard(...allowedRoles: Role[]) {
  return async function guardPreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const role = request.user?.role
    if (!role || !allowedRoles.includes(role)) {
      reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    }
  }
}

export const requireSuperAdmin = guard('super_admin')

export const requireOwner = guard('store_owner', 'super_admin')

export const requireManager = guard('store_manager', 'store_owner', 'super_admin')

export const requireSubscriber = guard(
  'subscriber',
  'community_mod',
  'store_manager',
  'store_owner',
  'super_admin',
)

export const requireAuth = guard(
  'user',
  'subscriber',
  'community_mod',
  'store_manager',
  'store_owner',
  'super_admin',
)
