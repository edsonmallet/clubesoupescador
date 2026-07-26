import { apiClient } from '@/shared/services/api-client'
import type {
  Category,
  CreateCommentInput,
  CreateTopicInput,
  PaginatedResult,
  ToggleReactionResponse,
  ToggleVoteResponse,
  Topic,
  TopicDetail,
  TopicSort,
} from '@clube/shared-types'

export const communityService = {
  listCategories: () => apiClient.get<Category[]>('/v1/community/categories'),
  listTopics: (categoryId: string | null, sort: TopicSort, page = 1) => {
    const params = new URLSearchParams({ sort, page: String(page) })
    if (categoryId) params.set('categoryId', categoryId)
    return apiClient.get<PaginatedResult<Topic>>(
      `/v1/community/topics?${params}`,
    )
  },
  getTopic: (id: string) =>
    apiClient.get<TopicDetail>(`/v1/community/topics/${id}`),
  createTopic: (data: CreateTopicInput) =>
    apiClient.post<Topic>('/v1/community/topics', data),
  createComment: (topicId: string, data: CreateCommentInput) =>
    apiClient.post(`/v1/community/topics/${topicId}/comments`, data),
  voteTopic: (id: string, value: 1 | -1) =>
    apiClient.post<ToggleVoteResponse>(`/v1/community/topics/${id}/vote`, {
      value,
    }),
  voteComment: (id: string, value: 1 | -1) =>
    apiClient.post<ToggleVoteResponse>(`/v1/community/comments/${id}/vote`, {
      value,
    }),
  reactTopic: (id: string, emoji: string) =>
    apiClient.post<ToggleReactionResponse>(`/v1/community/topics/${id}/react`, {
      emoji,
    }),
  reactComment: (id: string, emoji: string) =>
    apiClient.post<ToggleReactionResponse>(
      `/v1/community/comments/${id}/react`,
      { emoji },
    ),
}
