import { Type } from '@sinclair/typebox'

export const ReportSchema = Type.Object({
  id: Type.String(),
  targetType: Type.String(),
  targetId: Type.String(),
  reporterUid: Type.String(),
  reason: Type.String(),
  status: Type.String(),
  createdAt: Type.String(),
})

export const CreateReportBodySchema = Type.Object({
  targetType: Type.Union([Type.Literal('topic'), Type.Literal('comment')]),
  targetId: Type.String(),
  reason: Type.String({ minLength: 1 }),
})

export const ListReportsResponseSchema = Type.Object({
  items: Type.Array(ReportSchema),
  total: Type.Number(),
})

export const UpdateReportBodySchema = Type.Object({
  status: Type.Union([
    Type.Literal('pending'),
    Type.Literal('reviewed'),
    Type.Literal('dismissed'),
  ]),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
