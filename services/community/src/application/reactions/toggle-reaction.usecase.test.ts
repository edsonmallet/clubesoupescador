import { describe, expect, it, vi } from 'vitest'
import { ToggleReactionUseCase } from './toggle-reaction.usecase'

function makeDeps() {
  return {
    exists: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    countsByTarget: vi.fn(),
    findByUser: vi.fn(),
  }
}

describe('ToggleReactionUseCase', () => {
  it('adds the reaction when the user has not reacted with that emoji yet', async () => {
    const reactionRepository = makeDeps()
    reactionRepository.exists.mockResolvedValue(false)
    const usecase = new ToggleReactionUseCase(reactionRepository)

    const result = await usecase.execute({
      tenantId: 'tenant-1',
      targetType: 'topic',
      targetId: 'topic-1',
      uid: 'uid-1',
      emoji: '👍',
    })

    expect(result.added).toBe(true)
    expect(reactionRepository.add).toHaveBeenCalledWith(
      'tenant-1',
      'topic',
      'topic-1',
      'uid-1',
      '👍',
    )
    expect(reactionRepository.remove).not.toHaveBeenCalled()
  })

  it('removes the reaction (toggle off) when the same user reacts with the same emoji again — never two 👍 from the same user on the same post', async () => {
    const reactionRepository = makeDeps()
    reactionRepository.exists.mockResolvedValue(true)
    const usecase = new ToggleReactionUseCase(reactionRepository)

    const result = await usecase.execute({
      tenantId: 'tenant-1',
      targetType: 'topic',
      targetId: 'topic-1',
      uid: 'uid-1',
      emoji: '👍',
    })

    expect(result.added).toBe(false)
    expect(reactionRepository.remove).toHaveBeenCalledWith(
      'tenant-1',
      'topic',
      'topic-1',
      'uid-1',
      '👍',
    )
    expect(reactionRepository.add).not.toHaveBeenCalled()
  })

  it('checks existence scoped to the exact (target, user, emoji) tuple before deciding add vs remove', async () => {
    const reactionRepository = makeDeps()
    reactionRepository.exists.mockResolvedValue(false)
    const usecase = new ToggleReactionUseCase(reactionRepository)

    await usecase.execute({
      tenantId: 'tenant-1',
      targetType: 'comment',
      targetId: 'comment-1',
      uid: 'uid-2',
      emoji: '🔥',
    })

    expect(reactionRepository.exists).toHaveBeenCalledWith(
      'tenant-1',
      'comment',
      'comment-1',
      'uid-2',
      '🔥',
    )
  })

  it('different emojis from the same user on the same post are independent toggles', async () => {
    const reactionRepository = makeDeps()
    const usecase = new ToggleReactionUseCase(reactionRepository)

    // User already has 👍, now reacts with 🔥 — a different emoji, so it's
    // a fresh add, not a toggle-off of the existing 👍.
    reactionRepository.exists.mockResolvedValueOnce(false)
    const result = await usecase.execute({
      tenantId: 'tenant-1',
      targetType: 'topic',
      targetId: 'topic-1',
      uid: 'uid-1',
      emoji: '🔥',
    })

    expect(result.added).toBe(true)
    expect(reactionRepository.add).toHaveBeenCalledWith(
      'tenant-1',
      'topic',
      'topic-1',
      'uid-1',
      '🔥',
    )
  })
})
