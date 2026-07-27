import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { TenantBilling } from '../../../domain/entities/tenant-billing'
import type { TenantBillingStatus } from '../../../domain/entities/tenant-billing'
import type {
  CreateTenantBillingDto,
  ITenantBillingRepository,
  UpdateAsaasDetailsDto,
} from '../../../domain/interfaces/ITenantBillingRepository'
import type { schema } from '../schema'
import { tenantBilling } from '../schema/billing'

type TenantBillingRow = typeof tenantBilling.$inferSelect

function toDomain(row: TenantBillingRow): TenantBilling {
  return TenantBilling.create({
    id: row.id,
    tenantId: row.tenantId,
    planId: row.planId,
    asaasCustomerId: row.asaasCustomerId,
    asaasSubscriptionId: row.asaasSubscriptionId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export class TenantBillingRepository implements ITenantBillingRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findByTenantId(tenantId: string): Promise<TenantBilling | null> {
    const [row] = await this.db
      .select()
      .from(tenantBilling)
      .where(eq(tenantBilling.tenantId, tenantId))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async findByAsaasSubscriptionId(
    asaasSubscriptionId: string,
  ): Promise<TenantBilling | null> {
    const [row] = await this.db
      .select()
      .from(tenantBilling)
      .where(eq(tenantBilling.asaasSubscriptionId, asaasSubscriptionId))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async create(data: CreateTenantBillingDto): Promise<TenantBilling> {
    const [row] = await this.db
      .insert(tenantBilling)
      .values({
        tenantId: data.tenantId,
        planId: data.planId,
        asaasCustomerId: data.asaasCustomerId,
        asaasSubscriptionId: data.asaasSubscriptionId,
        status: data.status,
      })
      .returning()

    return toDomain(row as TenantBillingRow)
  }

  async updateStatus(
    id: string,
    status: TenantBillingStatus,
  ): Promise<TenantBilling> {
    const [row] = await this.db
      .update(tenantBilling)
      .set({ status, updatedAt: new Date() })
      .where(eq(tenantBilling.id, id))
      .returning()

    return toDomain(row as TenantBillingRow)
  }

  async updateAsaasDetails(
    id: string,
    data: UpdateAsaasDetailsDto,
  ): Promise<TenantBilling> {
    const [row] = await this.db
      .update(tenantBilling)
      .set({
        planId: data.planId,
        asaasCustomerId: data.asaasCustomerId,
        asaasSubscriptionId: data.asaasSubscriptionId,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(tenantBilling.id, id))
      .returning()

    return toDomain(row as TenantBillingRow)
  }

  async list(): Promise<TenantBilling[]> {
    const rows = await this.db.select().from(tenantBilling)
    return rows.map(toDomain)
  }
}
