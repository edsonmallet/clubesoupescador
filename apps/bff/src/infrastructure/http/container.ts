import {
  createFirebaseAuthPreHandler,
  createTenantAuthPreHandler,
} from '@clube/fastify-plugins'
import { CreateTenantUseCase } from '../../application/super-tenants/create-tenant.usecase'
import { GetTenantUseCase } from '../../application/super-tenants/get-tenant.usecase'
import { ImpersonateTenantUseCase } from '../../application/super-tenants/impersonate-tenant.usecase'
import { ListTenantsUseCase } from '../../application/super-tenants/list-tenants.usecase'
import { UpdateTenantStatusUseCase } from '../../application/super-tenants/update-tenant-status.usecase'
import { AddDomainUseCase } from '../../application/tenants/add-domain.usecase'
import { GetLandingConfigUseCase } from '../../application/tenants/get-landing-config.usecase'
import { GetMeUseCase } from '../../application/tenants/get-me.usecase'
import { ListDomainsUseCase } from '../../application/tenants/list-domains.usecase'
import { RegisterUserUseCase } from '../../application/tenants/register-user.usecase'
import { UpdateLandingConfigUseCase } from '../../application/tenants/update-landing-config.usecase'
import { VerifyDomainUseCase } from '../../application/tenants/verify-domain.usecase'
import { db } from '../db'
import { DomainRepository } from '../db/repositories/domain.repository'
import { LandingConfigRepository } from '../db/repositories/landing-config.repository'
import { TenantRepository } from '../db/repositories/tenant.repository'
import { UserRepository } from '../db/repositories/user.repository'
import { createResolveTenant } from './proxy'

const tenantRepository = new TenantRepository(db)
const userRepository = new UserRepository(db)
const landingConfigRepository = new LandingConfigRepository(db)
const domainRepository = new DomainRepository(db)

export const tenantAuthPreHandler = createTenantAuthPreHandler(
  createResolveTenant(tenantRepository),
)

export const registerUserUseCase = new RegisterUserUseCase(userRepository)
export const getMeUseCase = new GetMeUseCase(userRepository)
export const getLandingConfigUseCase = new GetLandingConfigUseCase(
  landingConfigRepository,
)
export const updateLandingConfigUseCase = new UpdateLandingConfigUseCase(
  landingConfigRepository,
)
export const listDomainsUseCase = new ListDomainsUseCase(domainRepository)
export const addDomainUseCase = new AddDomainUseCase(domainRepository)
export const verifyDomainUseCase = new VerifyDomainUseCase(domainRepository)

export const superAuthPreHandler = createFirebaseAuthPreHandler()

export const listTenantsUseCase = new ListTenantsUseCase(tenantRepository)
export const getTenantUseCase = new GetTenantUseCase(tenantRepository)
export const createTenantUseCase = new CreateTenantUseCase(
  tenantRepository,
  userRepository,
)
export const updateTenantStatusUseCase = new UpdateTenantStatusUseCase(
  tenantRepository,
)
export const impersonateTenantUseCase = new ImpersonateTenantUseCase(
  tenantRepository,
)
