export type XpConfig = {
  tenantId: string
  source: string
  points: number
  dailyCap: number | null
}

export interface IXpConfigRepository {
  findAll(tenantId: string): Promise<XpConfig[]>
  upsert(config: XpConfig): Promise<XpConfig>
}
