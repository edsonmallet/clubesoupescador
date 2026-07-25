// Re-export everything at the top level (in addition to the `schema` object
// below) because `drizzle-kit generate` only detects Table/Enum instances
// among this module's top-level exports — it does not recurse into a nested
// wrapper object. Without this, `drizzle-kit generate` silently finds
// "0 tables" and produces no migration.
export * from './subscriptions'

import { levels, plans, subscribers, xpEvents } from './subscriptions'

export const schema = { levels, plans, subscribers, xpEvents }
