import { count, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Tenant } from '../../../domain/entities/tenant'
import type {
  CreateTenantDto,
  ITenantRepository,
} from '../../../domain/interfaces/ITenantRepository'
import type { schema } from '../schema'
import { domains, tenants, users } from '../schema/tenants'

type TenantRow = typeof tenants.$inferSelect

function toDomain(row: TenantRow): Tenant {
  return Tenant.create({
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoUrl: row.logoUrl,
    planId: row.planId,
    status: row.status,
    ownerUid: row.ownerUid,
    settings: row.settings,
    createdAt: row.createdAt,
  })
}

export class TenantRepository implements ITenantRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findBySlug(slug: string): Promise<Tenant | null> {
    const [row] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const [row] = await this.db
      .select({ tenant: tenants })
      .from(domains)
      .innerJoin(tenants, eq(domains.tenantId, tenants.id))
      .where(eq(domains.domain, domain))
      .limit(1)

    return row ? toDomain(row.tenant) : null
  }

  async create(data: CreateTenantDto): Promise<Tenant> {
    const [row] = await this.db
      .insert(tenants)
      .values({
        slug: data.slug,
        name: data.name,
        ownerUid: data.ownerUid,
        logoUrl: data.logoUrl ?? null,
        planId: data.planId ?? null,
        settings: data.settings ?? {},
      })
      .returning()

    return toDomain(row as TenantRow)
  }

  async list(): Promise<Tenant[]> {
    const rows = await this.db.select().from(tenants)
    return rows.map(toDomain)
  }

  async findById(id: string): Promise<Tenant | null> {
    const [row] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async updateStatus(id: string, status: TenantRow['status']): Promise<Tenant> {
    const [row] = await this.db
      .update(tenants)
      .set({ status })
      .where(eq(tenants.id, id))
      .returning()

    return toDomain(row as TenantRow)
  }

  async countUsers(id: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(users)
      .where(eq(users.tenantId, id))

    return row?.value ?? 0
  }
}
