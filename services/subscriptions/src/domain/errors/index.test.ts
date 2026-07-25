import { describe, expect, it } from 'vitest'
import {
  PlanNotFoundError,
  SubscriptionAlreadyActiveError,
  SubscriptionNotFoundError,
} from './index'

describe('subscriptions domain errors', () => {
  it('SubscriptionNotFoundError carries a 404 and the subscription id', () => {
    const error = new SubscriptionNotFoundError('sub-1')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('SUBSCRIPTION_NOT_FOUND')
    expect(error.message).toContain('sub-1')
  })

  it('PlanNotFoundError carries a 404 and the plan id', () => {
    const error = new PlanNotFoundError('plan-1')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('PLAN_NOT_FOUND')
    expect(error.message).toContain('plan-1')
  })

  it('SubscriptionAlreadyActiveError carries a 409 and the uid', () => {
    const error = new SubscriptionAlreadyActiveError('uid-1')
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('SUBSCRIPTION_ALREADY_ACTIVE')
    expect(error.message).toContain('uid-1')
  })
})
