import type { Topic } from '../../domain/entities/Topic'
import { CategoryNotFoundError } from '../../domain/errors'
import type { ICategoryRepository } from '../../domain/interfaces/ICategoryRepository'
import type { ITopicRepository } from '../../domain/interfaces/ITopicRepository'

const TOPIC_CREATED_XP = 10

export type CreateTopicInput = {
  tenantId: string
  categoryId: string
  authorUid: string
  title: string
  body: string
}

export type EnqueueGrantXp = (data: {
  tenantId: string
  uid: string
  amount: number
  source: string
}) => Promise<void>

export class CreateTopicUseCase {
  constructor(
    private readonly topicRepository: ITopicRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly enqueueGrantXp: EnqueueGrantXp,
  ) {}

  async execute(input: CreateTopicInput): Promise<Topic> {
    const category = await this.categoryRepository.findById(
      input.tenantId,
      input.categoryId,
    )
    if (!category) throw new CategoryNotFoundError(input.categoryId)

    const topic = await this.topicRepository.create({
      tenantId: input.tenantId,
      categoryId: input.categoryId,
      authorUid: input.authorUid,
      title: input.title,
      body: input.body,
    })

    // Best-effort — a topic already exists once created; XP is a reward on
    // top, not something that should roll back topic creation if it fails.
    await this.enqueueGrantXp({
      tenantId: input.tenantId,
      uid: input.authorUid,
      amount: TOPIC_CREATED_XP,
      source: 'community_topic',
    })

    return topic
  }
}
