import type { AuthenticatedUser, Tenant } from '@clube/fastify-plugins'
import type { FastifyInstance, preHandlerHookHandler } from 'fastify'
import type { GetMeUseCase } from '../../../application/tenants/get-me.usecase'
import type { RegisterUserUseCase } from '../../../application/tenants/register-user.usecase'
import { MeResponseSchema, RegisterUserResponseSchema } from '../schemas/auth'

export type AuthRouteDeps = {
  tenantAuthPreHandler: preHandlerHookHandler
  requireAuth: preHandlerHookHandler
  registerUserUseCase: RegisterUserUseCase
  getMeUseCase: GetMeUseCase
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  deps: AuthRouteDeps,
): Promise<void> {
  app.post(
    '/v1/auth/register',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: { 200: RegisterUserResponseSchema } },
    },
    async (request, reply) => {
      const user = request.user as AuthenticatedUser
      const tenant = request.tenant as Tenant

      const createdUser = await deps.registerUserUseCase.execute({
        uid: user.uid,
        tenantId: tenant.id,
        currentRole: user.role,
        currentTenantId: user.tenant_id,
      })

      reply.status(200).send({
        id: createdUser.id,
        tenantId: createdUser.tenantId,
        uid: createdUser.uid,
        role: createdUser.role,
        createdAt: createdUser.createdAt.toISOString(),
      })
    },
  )

  app.get(
    '/v1/auth/me',
    {
      preHandler: [deps.tenantAuthPreHandler, deps.requireAuth],
      schema: { response: { 200: MeResponseSchema } },
    },
    async (request, reply) => {
      const user = request.user as AuthenticatedUser
      const tenant = request.tenant as Tenant

      const result = await deps.getMeUseCase.execute({
        uid: user.uid,
        tenantId: tenant.id,
        role: user.role,
      })

      reply.status(200).send({
        uid: result.uid,
        role: result.role,
        tenantId: result.tenantId,
        registeredAt: result.registeredAt?.toISOString() ?? null,
      })
    },
  )
}
