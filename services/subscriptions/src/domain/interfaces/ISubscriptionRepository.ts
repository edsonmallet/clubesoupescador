import type { Subscription, SubscriptionStatus } from '../entities/subscription'

export type CreateSubscriptionDto = {
  tenantId: string
  uid: string
  planId: string
  asaasCustomerId: string | null
  asaasSubscriptionId: string | null
  status: SubscriptionStatus
}

export interface ISubscriptionRepository {
  findByUid(uid: string, tenantId: string): Promise<Subscription | null>
  findByAsaasSubscriptionId(
    asaasSubscriptionId: string,
  ): Promise<Subscription | null>
  create(data: CreateSubscriptionDto): Promise<Subscription>
  updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription>
  updateXp(
    id: string,
    totalXp: number,
    levelId: string | null,
  ): Promise<Subscription>
}
