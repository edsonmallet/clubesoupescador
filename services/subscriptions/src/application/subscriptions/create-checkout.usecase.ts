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
  name: string
  cpfCnpj: string
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

    // Reuse the Asaas customer already linked to a previous (lapsed) attempt
    // before falling back to a lookup/create round-trip.
    let customerId = existing?.asaasCustomerId ?? null
    if (!customerId) {
      const found = await this.asaasClient.findCustomerByExternalReference(
        input.uid,
      )
      customerId =
        found?.id ??
        (
          await this.asaasClient.createCustomer({
            name: input.name,
            cpfCnpj: input.cpfCnpj,
            externalReference: input.uid,
          })
        ).id
    }

    const nextDueDate = new Date()
    nextDueDate.setDate(nextDueDate.getDate() + 1)

    const subscription = await this.asaasClient.createSubscription({
      customer: customerId,
      billingType: 'UNDEFINED',
      value: plan.priceCents / 100,
      cycle: 'MONTHLY',
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
    })

    // A prior row exists (inactive/overdue/cancelled): update it in place.
    // Inserting again would violate the subscribers_uid_tenant_idx unique
    // index and surface as a bare 500 to the caller.
    if (existing) {
      await this.subscriptionRepository.updateAsaasDetails(existing.id, {
        planId: input.planId,
        asaasCustomerId: customerId,
        asaasSubscriptionId: subscription.id,
        status: 'inactive',
      })
    } else {
      await this.subscriptionRepository.create({
        tenantId: input.tenantId,
        uid: input.uid,
        planId: input.planId,
        asaasCustomerId: customerId,
        asaasSubscriptionId: subscription.id,
        status: 'inactive',
      })
    }

    return { paymentUrl: await this.resolvePaymentUrl(subscription.id) }
  }

  /**
   * Asaas does not return a payment link on the subscription object itself;
   * the invoice URL lives on the subscription's first generated payment.
   * Asaas may take a moment to generate it, so `null` is an accepted
   * degraded result rather than a hard failure.
   */
  private async resolvePaymentUrl(
    asaasSubscriptionId: string,
  ): Promise<string | null> {
    try {
      const payments =
        await this.asaasClient.listPaymentsBySubscription(asaasSubscriptionId)
      return payments.data[0]?.invoiceUrl ?? null
    } catch {
      return null
    }
  }
}
