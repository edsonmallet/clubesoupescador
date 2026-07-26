import type { Topic } from '../entities/Topic'

export type TopicSort = 'hot' | 'new' | 'top' | 'rising'

export type CreateTopicDto = {
  tenantId: string
  categoryId: string
  authorUid: string
  title: string
  body: string
}

export type UpdateTopicDto = Partial<{
  pinned: boolean
  locked: boolean
  deleted: boolean
}>

export type PaginatedResult<T> = {
  items: T[]
  total: number
}

export interface ITopicRepository {
  create(data: CreateTopicDto): Promise<Topic>
  findById(tenantId: string, id: string): Promise<Topic | null>
  findMany(
    tenantId: string,
    categoryId: string | null,
    sort: TopicSort,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Topic>>
  update(id: string, data: UpdateTopicDto): Promise<Topic>
  incrementCommentCount(id: string, delta: number): Promise<void>
  updateVoteScore(id: string, delta: number): Promise<void>
}
