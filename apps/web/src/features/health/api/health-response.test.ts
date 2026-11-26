import { describe, expect, test } from 'vitest'

import { healthResponseSchema } from './health-response'

describe('healthResponseSchema', () => {
  test('accepts a response of the contract', () => {
    expect(healthResponseSchema.parse({ status: 'down', database: 'down' })).toEqual({
      status: 'down',
      database: 'down',
    })
  })

  test('refuses a state the contract does not have', () => {
    expect(healthResponseSchema.safeParse({ status: 'degraded', database: 'up' }).success).toBe(
      false,
    )
  })

  test('refuses a response without the state of the database', () => {
    expect(healthResponseSchema.safeParse({ status: 'up' }).success).toBe(false)
  })
})
