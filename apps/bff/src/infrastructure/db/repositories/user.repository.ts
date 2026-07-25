import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { User } from '../../../domain/entities/user'
import type {
  CreateUserDto,
  IUserRepository,
} from '../../../domain/interfaces/IUserRepository'
import type { schema } from '../schema'
import { users } from '../schema/tenants'

type UserRow = typeof users.$inferSelect

function toDomain(row: UserRow): User {
  return User.create({
    id: row.id,
    tenantId: row.tenantId,
    uid: row.uid,
    role: row.role,
    createdAt: row.createdAt,
  })
}

export class UserRepository implements IUserRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findByUid(uid: string, tenantId: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.uid, uid), eq(users.tenantId, tenantId)))
      .limit(1)

    return row ? toDomain(row) : null
  }

  async create(data: CreateUserDto): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        tenantId: data.tenantId,
        uid: data.uid,
        role: data.role,
      })
      .returning()

    return toDomain(row as UserRow)
  }
}
