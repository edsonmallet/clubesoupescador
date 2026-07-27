import type { Subscription, SubscriptionStatus } from '../entities/subscription'

export type CreateSubscriptionDto = {
  tenantId: string
  uid: string
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: SubscriptionStatus
}

export type UpdateAsaasDetailsDto = {
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: SubscriptionStatus
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
}

export interface ISubscriptionRepository {
  findByUid(uid: string, tenantId: string): Promise<Subscription | null>
  findByAsaasSubscriptionId(
    asaasSubscriptionId: string,
  ): Promise<Subscription | null>
  findById(id: string): Promise<Subscription | null>
  findMany(
    tenantId: string,
    page: number,
    perPage: number,
    status?: SubscriptionStatus,
  ): Promise<PaginatedResult<Subscription>>
  create(data: CreateSubscriptionDto): Promise<Subscription>
  updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription>
  updateAsaasDetails(
    id: string,
    data: UpdateAsaasDetailsDto,
  ): Promise<Subscription>
  updateXp(
    id: string,
    totalXp: number,
    levelId: string | null,
  ): Promise<Subscription>
}
