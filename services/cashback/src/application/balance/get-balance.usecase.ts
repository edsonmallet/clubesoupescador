import type {
  CashbackBalance,
  ICashbackRepository,
} from '../../domain/interfaces/ICashbackRepository'

export type GetBalanceInput = {
  tenantId: string
  uid: string
}

export class GetBalanceUseCase {
  constructor(private readonly cashbackRepository: ICashbackRepository) {}

  execute(input: GetBalanceInput): Promise<CashbackBalance> {
    return this.cashbackRepository.getBalance(input.tenantId, input.uid)
  }
}
