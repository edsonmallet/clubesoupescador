import { Type } from '@sinclair/typebox'

export const TopicSchema = Type.Object({
  id: Type.String(),
  categoryId: Type.String(),
  authorUid: Type.String(),
  title: Type.String(),
  body: Type.String(),
  pinned: Type.Boolean(),
  locked: Type.Boolean(),
  voteScore: Type.Number(),
  commentCount: Type.Number(),
  createdAt: Type.String(),
})

export const ListTopicsResponseSchema = Type.Object({
  items: Type.Array(TopicSchema),
  total: Type.Number(),
})

export const CommentSchema = Type.Object({
  id: Type.String(),
  topicId: Type.String(),
  authorUid: Type.String(),
  parentId: Type.Union([Type.String(), Type.Null()]),
  depth: Type.Number(),
  body: Type.String(),
  voteScore: Type.Number(),
  deleted: Type.Boolean(),
  createdAt: Type.String(),
})

export const TopicDetailResponseSchema = Type.Object({
  topic: TopicSchema,
  comments: Type.Array(CommentSchema),
  reactionCounts: Type.Record(Type.String(), Type.Number()),
  myReactions: Type.Array(Type.String()),
})

export const CreateTopicBodySchema = Type.Object({
  categoryId: Type.String(),
  title: Type.String({ minLength: 1 }),
  body: Type.String({ minLength: 1 }),
})

export const UpdateTopicBodySchema = Type.Partial(
  Type.Object({
    pinned: Type.Boolean(),
    locked: Type.Boolean(),
    deleted: Type.Boolean(),
  }),
)

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
