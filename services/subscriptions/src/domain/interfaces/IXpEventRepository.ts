export type CreateXpEventDto = {
  tenantId: string
  subscriberId: string
  amount: number
  source: string
}

export interface IXpEventRepository {
  insert(event: CreateXpEventDto): Promise<void>
}
