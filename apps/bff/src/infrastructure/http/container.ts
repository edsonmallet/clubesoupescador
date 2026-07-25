import { createTenantAuthPreHandler } from '@clube/fastify-plugins'
import { GetMeUseCase } from '../../application/tenants/get-me.usecase'
import { RegisterUserUseCase } from '../../application/tenants/register-user.usecase'
import { db } from '../db'
import { TenantRepository } from '../db/repositories/tenant.repository'
import { UserRepository } from '../db/repositories/user.repository'
import { createResolveTenant } from './proxy'

const tenantRepository = new TenantRepository(db)
const userRepository = new UserRepository(db)

export const tenantAuthPreHandler = createTenantAuthPreHandler(
  createResolveTenant(tenantRepository),
)

export const registerUserUseCase = new RegisterUserUseCase(userRepository)
export const getMeUseCase = new GetMeUseCase(userRepository)
