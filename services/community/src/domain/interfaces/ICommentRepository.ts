import type { Comment } from '../entities/Comment'

export type CreateCommentDto = {
  tenantId: string
  topicId: string
  authorUid: string
  parentId: string | null
  depth: number
  body: string
}

export interface ICommentRepository {
  create(data: CreateCommentDto): Promise<Comment>
  findById(tenantId: string, id: string): Promise<Comment | null>
  findByTopic(tenantId: string, topicId: string): Promise<Comment[]>
  softDelete(id: string): Promise<void>
  updateVoteScore(id: string, delta: number): Promise<void>
}
