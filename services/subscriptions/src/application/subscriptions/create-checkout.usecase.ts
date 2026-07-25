import type { AsaasClient } from '@clube/asaas-sdk'
import {
  PlanNotFoundError,
  SubscriptionAlreadyActiveError,
} from '../../domain/errors'
import type { IPlanRepository } from '../../domain/interfaces/IPlanRepository'
import type { ISubscriptionRepository } from '../../domain/interfaces/ISubscriptionRepository'

export type CreateCheckoutInput = {
  uid: string
  tenantId: string
  planId: string
}

export type CreateCheckoutOutput = {
  paymentUrl: string | null
}

export class CreateCheckoutUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planRepository: IPlanRepository,
    private readonly asaasClient: AsaasClient,
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    const plan = await this.planRepository.findById(input.planId)
    if (!plan || plan.tenantId !== input.tenantId) {
      throw new PlanNotFoundError(input.planId)
    }

    const existing = await this.subscriptionRepository.findByUid(
      input.uid,
      input.tenantId,
    )
    if (existing?.status === 'active') {
      throw new SubscriptionAlreadyActiveError(input.uid)
    }

    let customer = await this.asaasClient.findCustomerByExternalReference(
      input.uid,
    )
    if (!customer) {
      customer = await this.asaasClient.createCustomer({
        name: input.uid,
        cpfCnpj: '',
        externalReference: input.uid,
      })
    }

    const nextDueDate = new Date()
    nextDueDate.setDate(nextDueDate.getDate() + 1)

    const subscription = await this.asaasClient.createSubscription({
      customer: customer.id,
      billingType: 'UNDEFINED',
      value: plan.priceCents / 100,
      cycle: 'MONTHLY',
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
    })

    await this.subscriptionRepository.create({
      tenantId: input.tenantId,
      uid: input.uid,
      planId: input.planId,
      asaasCustomerId: customer.id,
      asaasSubscriptionId: subscription.id,
      status: 'inactive',
    })

    return { paymentUrl: subscription.paymentLink ?? null }
  }
}
