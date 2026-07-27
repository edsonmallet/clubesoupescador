import type { Level } from '../entities/level'

export type UpdateLevelDto = Partial<{
  name: string
  minXp: number
  storeDiscountPct: number
  cashbackPct: number
}>

export interface ILevelRepository {
  findAll(): Promise<Level[]>
  findById(id: string): Promise<Level | null>
  findHighestForXp(totalXp: number): Promise<Level | null>
  update(id: string, data: UpdateLevelDto): Promise<Level>
}
