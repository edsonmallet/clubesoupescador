import type { AsaasClient } from '@clube/asaas-sdk'
import type { TenantBillingStatus } from '../../domain/entities/tenant-billing'
import {
  PlanNotFoundError,
  TenantBillingAlreadyActiveError,
} from '../../domain/errors'
import type { ISaasPlanRepository } from '../../domain/interfaces/ISaasPlanRepository'
import type { ITenantBillingRepository } from '../../domain/interfaces/ITenantBillingRepository'

export type CreateCheckoutInput = {
  tenantId: string
  planId: string
  // Asaas requires a real name/document to create a customer. Unlike
  // services/subscriptions (where the member's own uid/name/cpfCnpj are on
  // hand), the billing service has no domain knowledge of the store owner —
  // that data lives in the BFF's tenants schema — so the caller (the admin
  // app, via a Task 3/4 route) must supply it.
  name: string
  cpfCnpj: string
}

export type CreateCheckoutOutput = {
  id: string
  status: TenantBillingStatus
  paymentUrl: string | null
}

export class CreateCheckoutUseCase {
  constructor(
    private readonly tenantBillingRepository: ITenantBillingRepository,
    private readonly saasPlanRepository: ISaasPlanRepository,
    private readonly asaasClient: AsaasClient,
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    const plan = await this.saasPlanRepository.findById(input.planId)
    if (!plan || !plan.active) {
      throw new PlanNotFoundError(input.planId)
    }

    const existing = await this.tenantBillingRepository.findByTenantId(
      input.tenantId,
    )
    if (existing?.status === 'active') {
      throw new TenantBillingAlreadyActiveError(input.tenantId)
    }

    // Reuse the Asaas customer already linked to a previous (lapsed) attempt
    // before falling back to a lookup/create round-trip.
    let customerId = existing?.asaasCustomerId ?? null
    if (!customerId) {
      const found = await this.asaasClient.findCustomerByExternalReference(
        input.tenantId,
      )
      customerId =
        found?.id ??
        (
          await this.asaasClient.createCustomer({
            name: input.name,
            cpfCnpj: input.cpfCnpj,
            externalReference: input.tenantId,
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
    // Inserting again would violate the tenant_billing_tenant_idx unique
    // index and surface as a bare 500 to the caller.
    // The write always returns the persisted row, so the route can build its
    // `{id, status, paymentUrl}` response from this output directly — no
    // extra read-back is needed (and no silent fallback if one were to fail).
    const tenantBilling = existing
      ? await this.tenantBillingRepository.updateAsaasDetails(existing.id, {
          planId: input.planId,
          asaasCustomerId: customerId,
          asaasSubscriptionId: subscription.id,
          status: 'inactive',
        })
      : await this.tenantBillingRepository.create({
          tenantId: input.tenantId,
          planId: input.planId,
          asaasCustomerId: customerId,
          asaasSubscriptionId: subscription.id,
          status: 'inactive',
        })

    return {
      id: tenantBilling.id,
      status: tenantBilling.status,
      paymentUrl: await this.resolvePaymentUrl(subscription.id),
    }
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
