import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Tenant } from '../../../domain/entities/tenant'
import type {
  CreateTenantDto,
  ITenantRepository,
} from '../../../domain/interfaces/ITenantRepository'
import type { schema } from '../schema'
import { domains, tenants } from '../schema/tenants'

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
}
