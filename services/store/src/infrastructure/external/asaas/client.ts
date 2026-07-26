import { AsaasClient } from '@clube/asaas-sdk'
import { env } from '../../../shared/env'

let instance: AsaasClient | null = null

export function getAsaasClient(): AsaasClient {
  if (!instance) {
    instance = new AsaasClient(env.ASAAS_API_KEY, env.ASAAS_ENV)
  }
  return instance
}
