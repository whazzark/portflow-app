import { describe, expect, test } from 'vitest'

import { healthAnswerSchema, toHealthStatus } from './health'

describe('healthAnswerSchema', () => {
  test('accepts an answer of the contract', () => {
    expect(healthAnswerSchema.parse({ status: 'down', database: 'down' })).toEqual({
      status: 'down',
      database: 'down',
    })
  })

  test('refuses a state the contract does not have', () => {
    expect(healthAnswerSchema.safeParse({ status: 'degraded', database: 'up' }).success).toBe(false)
  })

  test('refuses an answer without the state of the database', () => {
    expect(healthAnswerSchema.safeParse({ status: 'up' }).success).toBe(false)
  })
})

describe('toHealthStatus', () => {
  test('says which components are up', () => {
    expect(toHealthStatus({ status: 'down', database: 'up' })).toEqual({
      serviceUp: false,
      databaseUp: true,
    })
  })
})
