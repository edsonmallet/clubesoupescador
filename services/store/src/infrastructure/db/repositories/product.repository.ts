import { and, eq, gte, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Product } from '../../../domain/entities/Product'
import { OutOfStockError } from '../../../domain/errors'
import type {
  CreateProductDto,
  IProductRepository,
  PaginatedResult,
  UpdateProductDto,
} from '../../../domain/interfaces/IProductRepository'
import type { schema } from '../schema'
import { products } from '../schema/store'

type ProductRow = typeof products.$inferSelect

function toDomain(row: ProductRow): Product {
  return Product.create({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    description: row.description,
    priceFullCents: row.priceFullCents,
    priceClubCents: row.priceClubCents,
    stock: row.stock,
    sku: row.sku,
    images: row.images,
    active: row.active,
    createdAt: row.createdAt,
  })
}

export class ProductRepository implements IProductRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findMany(
    tenantId: string,
    page: number,
    perPage: number,
    active?: boolean,
  ): Promise<PaginatedResult<Product>> {
    const conditions = [eq(products.tenantId, tenantId)]
    if (active !== undefined) conditions.push(eq(products.active, active))
    const where = and(...conditions)

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(where)
        .limit(perPage)
        .offset((page - 1) * perPage),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(where),
    ])

    return { items: rows.map(toDomain), total: count }
  }

  async findById(tenantId: string, id: string): Promise<Product | null> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  /**
   * Decrements stock atomically in a single statement guarded by
   * `stock >= qty` — under concurrent orders, whichever request's UPDATE
   * commits first wins the row lock, the other affects zero rows and throws
   * OutOfStockError, instead of both reading a stale count and overselling.
   */
  async updateStock(id: string, qty: number): Promise<void> {
    const result = await this.db
      .update(products)
      .set({ stock: sql`${products.stock} - ${qty}` })
      .where(and(eq(products.id, id), gte(products.stock, qty)))
      .returning({ id: products.id })

    if (result.length === 0) {
      throw new OutOfStockError(id)
    }
  }

  async create(data: CreateProductDto): Promise<Product> {
    const [row] = await this.db.insert(products).values(data).returning()

    return toDomain(row as ProductRow)
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const [row] = await this.db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning()

    return toDomain(row as ProductRow)
  }
}
