import type { Role } from '@clube/shared-types'
import { type App, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export type { Role }

export function getFirebaseApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!serviceAccountBase64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var is required')
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'),
  )

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  })
}

export const setRole = async (uid: string, role: Role, tenantId?: string) => {
  return getAuth(getFirebaseApp()).setCustomUserClaims(uid, {
    role,
    tenant_id: tenantId ?? null,
  })
}

export const getRole = async (uid: string): Promise<Role> => {
  const user = await getAuth(getFirebaseApp()).getUser(uid)
  return (user.customClaims?.role as Role) ?? 'user'
}

export const revokeRole = (uid: string) => {
  return setRole(uid, 'user')
}
