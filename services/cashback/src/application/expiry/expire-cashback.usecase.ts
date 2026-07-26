import type { ICashbackRepository } from '../../domain/interfaces/ICashbackRepository'

const CENTS_PER_XP = 10 // 1 XP per R$0,10

export type EnqueueGrantXp = (data: {
  tenantId: string
  uid: string
  amount: number
  source: string
}) => Promise<void>

export class ExpireCashbackUseCase {
  constructor(
    private readonly cashbackRepository: ICashbackRepository,
    private readonly enqueueGrantXp: EnqueueGrantXp,
  ) {}

  async execute(now: Date = new Date()): Promise<number> {
    const expired = await this.cashbackRepository.getExpiring(now)

    for (const entry of expired) {
      await this.cashbackRepository.debit({
        tenantId: entry.tenantId,
        uid: entry.uid,
        type: 'expired_to_xp',
        amountCents: entry.amountCents,
        source: 'expired_to_xp',
        sourceId: entry.id,
      })

      const xpBonus = Math.floor(entry.amountCents / CENTS_PER_XP)
      if (xpBonus > 0) {
        await this.enqueueGrantXp({
          tenantId: entry.tenantId,
          uid: entry.uid,
          amount: xpBonus,
          source: 'cashback_expired',
        })
      }
    }

    return expired.length
  }
}
