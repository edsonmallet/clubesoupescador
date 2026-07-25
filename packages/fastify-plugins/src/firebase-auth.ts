import { getFirebaseApp } from '@clube/firebase-utils'
import type { Role } from '@clube/shared-types'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { getAuth } from 'firebase-admin/auth'

export function createFirebaseAuthPreHandler() {
  return async function firebaseAuthPreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const token = request.headers.authorization?.split('Bearer ')[1]
    if (!token) return

    try {
      const decoded = await getAuth(getFirebaseApp()).verifyIdToken(token)
      request.user = {
        uid: decoded.uid,
        role: (decoded.role as Role) ?? 'user',
        tenant_id: (decoded.tenant_id as string) ?? null,
      }
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'auth/id-token-expired') {
        reply.status(401).send({
          error: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
        })
        return
      }
      reply.status(401).send({
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
      })
    }
  }
}
