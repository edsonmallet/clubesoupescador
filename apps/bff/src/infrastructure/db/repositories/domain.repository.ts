import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Domain } from '../../../domain/entities/domain'
import { DomainNotFoundError } from '../../../domain/errors/domain-not-found.error'
import type {
  CreateDomainDto,
  IDomainRepository,
  UpdateDomainVerificationDto,
} from '../../../domain/interfaces/IDomainRepository'
import type { schema } from '../schema'
import { domains } from '../schema/tenants'

type DomainRow = typeof domains.$inferSelect

function toDomain(row: DomainRow): Domain {
  return Domain.create({
    id: row.id,
    tenantId: row.tenantId,
    domain: row.domain,
    type: row.type,
    verified: row.verified,
    verifiedAt: row.verifiedAt,
    lastError: row.lastError,
    createdAt: row.createdAt,
  })
}

export class DomainRepository implements IDomainRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findByTenantId(tenantId: string): Promise<Domain[]> {
    const rows = await this.db
      .select()
      .from(domains)
      .where(eq(domains.tenantId, tenantId))

    return rows.map(toDomain)
  }

  async findById(id: string): Promise<Domain | null> {
    const [row] = await this.db
      .select()
      .from(domains)
      .where(eq(domains.id, id))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async create(data: CreateDomainDto): Promise<Domain> {
    const [row] = await this.db
      .insert(domains)
      .values({
        tenantId: data.tenantId,
        domain: data.domain,
        type: 'custom',
      })
      .returning()

    return toDomain(row as DomainRow)
  }

  async updateVerification(
    id: string,
    data: UpdateDomainVerificationDto,
  ): Promise<Domain> {
    const [row] = await this.db
      .update(domains)
      .set({
        verified: data.verified,
        verifiedAt: data.verifiedAt,
        lastError: data.lastError,
      })
      .where(eq(domains.id, id))
      .returning()

    if (!row) throw new DomainNotFoundError(id)

    return toDomain(row as DomainRow)
  }
}
