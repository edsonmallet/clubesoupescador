import type { ICommentRepository } from '../../domain/interfaces/ICommentRepository'
import type { ITopicRepository } from '../../domain/interfaces/ITopicRepository'
import type {
  IVoteRepository,
  VoteTargetType,
  VoteValue,
} from '../../domain/interfaces/IVoteRepository'

export type ToggleVoteInput = {
  tenantId: string
  targetType: VoteTargetType
  targetId: string
  uid: string
  value: VoteValue
}

export type ToggleVoteOutput = {
  scoreDelta: number
}

export class ToggleVoteUseCase {
  constructor(
    private readonly voteRepository: IVoteRepository,
    private readonly topicRepository: ITopicRepository,
    private readonly commentRepository: ICommentRepository,
  ) {}

  async execute(input: ToggleVoteInput): Promise<ToggleVoteOutput> {
    const existing = await this.voteRepository.findExisting(
      input.tenantId,
      input.targetType,
      input.targetId,
      input.uid,
    )

    let scoreDelta: number

    if (!existing) {
      await this.voteRepository.create(
        input.tenantId,
        input.targetType,
        input.targetId,
        input.uid,
        input.value,
      )
      scoreDelta = input.value
    } else if (existing.value === input.value) {
      // Voting the same direction again cancels the vote.
      await this.voteRepository.remove(existing.id)
      scoreDelta = -existing.value
    } else {
      // Switching direction (e.g. down -> up) swings the score by 2x.
      await this.voteRepository.updateValue(existing.id, input.value)
      scoreDelta = input.value - existing.value
    }

    if (scoreDelta !== 0) {
      if (input.targetType === 'topic') {
        await this.topicRepository.updateVoteScore(input.targetId, scoreDelta)
      } else {
        await this.commentRepository.updateVoteScore(input.targetId, scoreDelta)
      }
    }

    return { scoreDelta }
  }
}
