import type { Level } from '../entities/level'

export interface ILevelRepository {
  findAll(): Promise<Level[]>
  findHighestForXp(totalXp: number): Promise<Level | null>
}
