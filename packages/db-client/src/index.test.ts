import { describe, expect, it } from 'vitest'
import { createDbClient } from './index'

describe('createDbClient', () => {
  it('creates a drizzle client without connecting eagerly', () => {
    const db = createDbClient({}, 'postgres://user:pass@localhost:5432/db')
    expect(db).toBeDefined()
  })
})
