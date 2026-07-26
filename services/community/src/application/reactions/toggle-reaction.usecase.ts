import type {
  Emoji,
  IReactionRepository,
  ReactionTargetType,
} from '../../domain/interfaces/IReactionRepository'

export const ALLOWED_EMOJIS: Emoji[] = ['👍', '🔥', '😂', '😮', '🤔']

export type ToggleReactionInput = {
  tenantId: string
  targetType: ReactionTargetType
  targetId: string
  uid: string
  emoji: Emoji
}

export type ToggleReactionOutput = {
  added: boolean
}

export class ToggleReactionUseCase {
  constructor(private readonly reactionRepository: IReactionRepository) {}

  async execute(input: ToggleReactionInput): Promise<ToggleReactionOutput> {
    const alreadyReacted = await this.reactionRepository.exists(
      input.tenantId,
      input.targetType,
      input.targetId,
      input.uid,
      input.emoji,
    )

    if (alreadyReacted) {
      await this.reactionRepository.remove(
        input.tenantId,
        input.targetType,
        input.targetId,
        input.uid,
        input.emoji,
      )
      return { added: false }
    }

    await this.reactionRepository.add(
      input.tenantId,
      input.targetType,
      input.targetId,
      input.uid,
      input.emoji,
    )
    return { added: true }
  }
}
