export type VoteTargetType = 'topic' | 'comment'
export type VoteValue = 1 | -1

export type Vote = {
  id: string
  tenantId: string
  targetType: VoteTargetType
  targetId: string
  uid: string
  value: VoteValue
}

export interface IVoteRepository {
  findExisting(
    tenantId: string,
    targetType: VoteTargetType,
    targetId: string,
    uid: string,
  ): Promise<Vote | null>
  create(
    tenantId: string,
    targetType: VoteTargetType,
    targetId: string,
    uid: string,
    value: VoteValue,
  ): Promise<void>
  updateValue(id: string, value: VoteValue): Promise<void>
  remove(id: string): Promise<void>
}
