import type { Level } from '../entities/level'

export interface ILevelRepository {
  findAll(): Promise<Level[]>
  findById(id: string): Promise<Level | null>
  findHighestForXp(totalXp: number): Promise<Level | null>
}
