import type { Raffle } from '../../domain/entities/Raffle'
import type {
  IRaffleRepository,
  PaginatedResult,
} from '../../domain/interfaces/IRaffleRepository'

export type ListRafflesInput = {
  tenantId: string
  page: number
  perPage: number
}

export class ListRafflesUseCase {
  constructor(private readonly raffleRepository: IRaffleRepository) {}

  execute(input: ListRafflesInput): Promise<PaginatedResult<Raffle>> {
    return this.raffleRepository.findMany(
      input.tenantId,
      input.page,
      input.perPage,
    )
  }
}
