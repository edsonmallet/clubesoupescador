// Re-export everything at the top level (in addition to the `schema` object
// below) because `drizzle-kit generate` only detects Table/Enum instances
// among this module's top-level exports — it does not recurse into a nested
// wrapper object. Without this, `drizzle-kit generate` silently finds
// "0 tables" and produces no migration.
export * from './tenants'

import { domains, landingConfigs, tenants } from './tenants'

export const schema = {
  tenants,
  domains,
  landingConfigs,
}
