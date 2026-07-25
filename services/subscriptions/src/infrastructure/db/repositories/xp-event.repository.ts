import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type {
  CreateXpEventDto,
  IXpEventRepository,
} from '../../../domain/interfaces/IXpEventRepository'
import type { schema } from '../schema'
import { xpEvents } from '../schema/subscriptions'

export class XpEventRepository implements IXpEventRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async insert(event: CreateXpEventDto): Promise<void> {
    await this.db.insert(xpEvents).values({
      tenantId: event.tenantId,
      subscriberId: event.subscriberId,
      amount: event.amount,
      source: event.source,
    })
  }
}
