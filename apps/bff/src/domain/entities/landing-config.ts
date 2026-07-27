export type TemplateId = 'clube-simples' | 'clube-premium'

export type LandingConfigProps = {
  id: string
  tenantId: string
  templateId: TemplateId
  theme: Record<string, unknown>
  sections: Record<string, unknown>
  seo: Record<string, unknown>
  published: boolean
  publishedAt: Date | null
  updatedAt: Date
}

export class LandingConfig {
  private constructor(private readonly props: LandingConfigProps) {}

  static create(props: LandingConfigProps): LandingConfig {
    return new LandingConfig(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get templateId(): TemplateId {
    return this.props.templateId
  }

  get theme(): Record<string, unknown> {
    return this.props.theme
  }

  get sections(): Record<string, unknown> {
    return this.props.sections
  }

  get seo(): Record<string, unknown> {
    return this.props.seo
  }

  get published(): boolean {
    return this.props.published
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }
}
