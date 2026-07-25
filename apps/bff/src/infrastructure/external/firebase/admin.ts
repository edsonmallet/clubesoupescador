import { getFirebaseApp } from '@clube/firebase-utils'
import type { App } from 'firebase-admin/app'

// Delegates to @clube/firebase-utils's singleton initializer instead of
// calling initializeApp() again here — firebase-admin throws if a second
// caller tries to initialize the default app independently.
export function getFirebaseAdmin(): App {
  return getFirebaseApp()
}
