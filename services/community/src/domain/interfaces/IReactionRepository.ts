export type ReactionTargetType = 'topic' | 'comment'
export type Emoji = '👍' | '🔥' | '😂' | '😮' | '🤔'

export type ReactionCounts = Record<string, number>

export interface IReactionRepository {
  exists(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
    uid: string,
    emoji: Emoji,
  ): Promise<boolean>
  add(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
    uid: string,
    emoji: Emoji,
  ): Promise<void>
  remove(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
    uid: string,
    emoji: Emoji,
  ): Promise<void>
  countsByTarget(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<ReactionCounts>
  findByUser(
    tenantId: string,
    targetType: ReactionTargetType,
    targetId: string,
    uid: string,
  ): Promise<Emoji[]>
}
