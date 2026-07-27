import type { TenantBillingStatus } from '../../domain/entities/tenant-billing'
import type { ISaasPlanRepository } from '../../domain/interfaces/ISaasPlanRepository'
import type { ITenantBillingRepository } from '../../domain/interfaces/ITenantBillingRepository'

export type TenantBillingOverviewItem = {
  tenantId: string
  planName: string
  priceCents: number
  status: TenantBillingStatus
}

export type BillingOverviewSummary = {
  mrrCents: number
  overdueCount: number
}

export type GetBillingOverviewOutput = {
  items: TenantBillingOverviewItem[]
  summary: BillingOverviewSummary
}

export class GetBillingOverviewUseCase {
  constructor(
    private readonly tenantBillingRepository: ITenantBillingRepository,
    private readonly saasPlanRepository: ISaasPlanRepository,
  ) {}

  async execute(): Promise<GetBillingOverviewOutput> {
    const [tenantBillings, plans] = await Promise.all([
      this.tenantBillingRepository.list(),
      this.saasPlanRepository.list(),
    ])

    const plansById = new Map(plans.map((plan) => [plan.id, plan]))

    const items: TenantBillingOverviewItem[] = tenantBillings.map((tb) => {
      const plan = plansById.get(tb.planId)
      return {
        tenantId: tb.tenantId,
        planName: plan?.name ?? 'unknown',
        priceCents: plan?.priceCents ?? 0,
        status: tb.status,
      }
    })

    const summary = items.reduce<BillingOverviewSummary>(
      (acc, item) => {
        if (item.status === 'active') acc.mrrCents += item.priceCents
        if (item.status === 'overdue') acc.overdueCount += 1
        return acc
      },
      { mrrCents: 0, overdueCount: 0 },
    )

    return { items, summary }
  }
}
