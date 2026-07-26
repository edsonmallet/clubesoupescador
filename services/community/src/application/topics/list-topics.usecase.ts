import type { Topic } from '../../domain/entities/Topic'
import type {
  ITopicRepository,
  PaginatedResult,
  TopicSort,
} from '../../domain/interfaces/ITopicRepository'

export type ListTopicsInput = {
  tenantId: string
  categoryId: string | null
  sort: TopicSort
  page: number
  perPage: number
}

export class ListTopicsUseCase {
  constructor(private readonly topicRepository: ITopicRepository) {}

  execute(input: ListTopicsInput): Promise<PaginatedResult<Topic>> {
    return this.topicRepository.findMany(
      input.tenantId,
      input.categoryId,
      input.sort,
      input.page,
      input.perPage,
    )
  }
}

/**
 * Reddit-style "hot" ranking: net score decays with the square-root-ish
 * power of age, so a topic's rank fades over time even without new votes.
 * The `+ 2` floor keeps brand-new topics (age ~0h) from producing an
 * infinite/huge score, and keeps the denominator away from zero.
 *
 * Kept as a pure function (mirrored as SQL in TopicRepository for real
 * paginated ordering) so the exact formula is independently unit-testable.
 */
export function hotScore(
  voteScore: number,
  createdAt: Date,
  now: Date = new Date(),
): number {
  const hoursSinceCreation =
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  return voteScore / (hoursSinceCreation + 2) ** 1.5
}
