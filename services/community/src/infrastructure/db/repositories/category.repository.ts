import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Category } from '../../../domain/entities/Category'
import type {
  CreateCategoryDto,
  ICategoryRepository,
} from '../../../domain/interfaces/ICategoryRepository'
import type { schema } from '../schema'
import { categories } from '../schema/community'

type CategoryRow = typeof categories.$inferSelect

function toDomain(row: CategoryRow): Category {
  return Category.create({
    id: row.id,
    tenantId: row.tenantId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
  })
}

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findAll(tenantId: string): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenantId))
      .orderBy(categories.name)

    return rows.map(toDomain)
  }

  async findBySlug(tenantId: string, slug: string): Promise<Category | null> {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.tenantId, tenantId), eq(categories.slug, slug)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findById(tenantId: string, id: string): Promise<Category | null> {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    const [row] = await this.db.insert(categories).values(data).returning()
    return toDomain(row as CategoryRow)
  }
}
