import type { ICashbackConfigRepository } from '../../domain/interfaces/ICashbackConfigRepository'
import type { ICashbackRepository } from '../../domain/interfaces/ICashbackRepository'

const DEFAULT_PCT = 0
const DEFAULT_EXPIRY_MONTHS = 12

export type GrantCashbackInput = {
  tenantId: string
  uid: string
  source: string
  sourceId: string | null
  paidAmountCents: number
}

export class GrantCashbackUseCase {
  constructor(
    private readonly cashbackRepository: ICashbackRepository,
    private readonly configRepository: ICashbackConfigRepository,
  ) {}

  async execute(input: GrantCashbackInput): Promise<void> {
    const config = await this.configRepository.findBySource(
      input.tenantId,
      input.source,
    )
    const pct = config?.pct ?? DEFAULT_PCT
    const expiryMonths = config?.expiryMonths ?? DEFAULT_EXPIRY_MONTHS

    const amountCents = Math.round((input.paidAmountCents * pct) / 100)
    // Nothing configured (or 0%) for this source — no point writing a
    // zero-value ledger row.
    if (amountCents <= 0) return

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths)

    await this.cashbackRepository.credit({
      tenantId: input.tenantId,
      uid: input.uid,
      type: 'earned_purchase',
      amountCents,
      source: input.source,
      sourceId: input.sourceId,
      expiresAt,
    })
  }
}
