import type { CashbackEntry } from '../../domain/entities/CashbackEntry'
import type {
  ICashbackRepository,
  PaginatedResult,
} from '../../domain/interfaces/ICashbackRepository'

export type GetHistoryInput = {
  tenantId: string
  uid: string
  page: number
  perPage: number
}

export class GetHistoryUseCase {
  constructor(private readonly cashbackRepository: ICashbackRepository) {}

  execute(input: GetHistoryInput): Promise<PaginatedResult<CashbackEntry>> {
    return this.cashbackRepository.getHistory(
      input.tenantId,
      input.uid,
      input.page,
      input.perPage,
    )
  }
}
