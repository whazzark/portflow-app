import { describe, expect, test } from 'vitest'

import { toHealthStatus } from './health'

describe('toHealthStatus', () => {
  test('says which components are up', () => {
    expect(toHealthStatus({ status: 'down', database: 'up' })).toEqual({
      serviceUp: false,
      databaseUp: true,
    })
  })
})
