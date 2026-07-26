export type CashbackConfig = {
  tenantId: string
  source: string
  pct: number
  expiryMonths: number
}

export interface ICashbackConfigRepository {
  findBySource(tenantId: string, source: string): Promise<CashbackConfig | null>
  findAll(tenantId: string): Promise<CashbackConfig[]>
  upsert(config: CashbackConfig): Promise<CashbackConfig>
}
