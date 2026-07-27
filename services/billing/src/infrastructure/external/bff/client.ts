import { env } from '../../../shared/env'

export type UpdateTenantBillingStatus = 'active' | 'suspended'

export type UpdateTenantBillingDto = {
  status: UpdateTenantBillingStatus
  planId?: string
}

/**
 * Notifies the BFF that a tenant's billing status changed, so it can update
 * whatever gates lojista access (see apps/bff internal route, added in a
 * later task). Best-effort: this is called from inside the webhook usecase,
 * which must not fail — and thus must not retry forever in BullMQ — just
 * because the BFF happened to be unreachable. Same spirit as
 * `enqueueProcessWebhook` in services/subscriptions/src/infrastructure/http/routes/webhook.ts.
 */
export async function updateTenantBilling(
  tenantId: string,
  data: UpdateTenantBillingDto,
): Promise<void> {
  try {
    const response = await fetch(
      `${env.BFF_INTERNAL_URL}/internal/tenants/${tenantId}/billing`,
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': env.INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify(data),
      },
    )

    if (!response.ok) {
      console.error(
        `Failed to update tenant billing on BFF for tenant ${tenantId}: ${response.status} ${response.statusText}`,
      )
    }
  } catch (error) {
    console.error(
      `Failed to reach BFF to update tenant billing for tenant ${tenantId}`,
      error,
    )
  }
}
