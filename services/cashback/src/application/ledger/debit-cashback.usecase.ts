import { InsufficientCashbackError } from '../../domain/errors'
import type { ICashbackRepository } from '../../domain/interfaces/ICashbackRepository'

export type DebitCashbackInput = {
  tenantId: string
  uid: string
  source: string
  sourceId: string | null
  amountCents: number
}

export class DebitCashbackUseCase {
  constructor(private readonly cashbackRepository: ICashbackRepository) {}

  async execute(input: DebitCashbackInput): Promise<void> {
    const balance = await this.cashbackRepository.getBalance(
      input.tenantId,
      input.uid,
    )
    if (balance.availableCents < input.amountCents) {
      throw new InsufficientCashbackError(input.uid)
    }

    await this.cashbackRepository.debit({
      tenantId: input.tenantId,
      uid: input.uid,
      type: 'redeemed',
      amountCents: input.amountCents,
      source: input.source,
      sourceId: input.sourceId,
    })
  }
}
