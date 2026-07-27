import { Type } from '@sinclair/typebox'

export const LandingConfigSchema = Type.Object({
  templateId: Type.Union([
    Type.Literal('clube-simples'),
    Type.Literal('clube-premium'),
  ]),
  theme: Type.Record(Type.String(), Type.Unknown()),
  sections: Type.Record(Type.String(), Type.Unknown()),
  seo: Type.Record(Type.String(), Type.Unknown()),
  published: Type.Boolean(),
  publishedAt: Type.Union([Type.String(), Type.Null()]),
  updatedAt: Type.Union([Type.String(), Type.Null()]),
})

export const UpdateLandingConfigBodySchema = Type.Partial(
  Type.Object({
    templateId: Type.Union([
      Type.Literal('clube-simples'),
      Type.Literal('clube-premium'),
    ]),
    theme: Type.Record(Type.String(), Type.Unknown()),
    sections: Type.Record(Type.String(), Type.Unknown()),
    seo: Type.Record(Type.String(), Type.Unknown()),
    published: Type.Boolean(),
  }),
)

export const DomainSchema = Type.Object({
  id: Type.String(),
  domain: Type.String(),
  type: Type.Union([Type.Literal('subdomain'), Type.Literal('custom')]),
  verified: Type.Boolean(),
  verifiedAt: Type.Union([Type.String(), Type.Null()]),
  lastError: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
})

export const ListDomainsResponseSchema = Type.Array(DomainSchema)

export const CreateDomainBodySchema = Type.Object({
  domain: Type.String({ minLength: 1 }),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
})
