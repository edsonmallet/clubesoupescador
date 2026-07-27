import type {
  TenantBilling,
  TenantBillingStatus,
} from '../entities/tenant-billing'

export type CreateTenantBillingDto = {
  tenantId: string
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: TenantBillingStatus
}

export type UpdateAsaasDetailsDto = {
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: TenantBillingStatus
}

export interface ITenantBillingRepository {
  findByTenantId(tenantId: string): Promise<TenantBilling | null>
  findByAsaasSubscriptionId(
    asaasSubscriptionId: string,
  ): Promise<TenantBilling | null>
  create(data: CreateTenantBillingDto): Promise<TenantBilling>
  updateStatus(id: string, status: TenantBillingStatus): Promise<TenantBilling>
  updateAsaasDetails(
    id: string,
    data: UpdateAsaasDetailsDto,
  ): Promise<TenantBilling>
  list(): Promise<TenantBilling[]>
}
