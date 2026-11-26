import { describe, expect, test } from 'vitest'

import { isoDateTime } from './schemas'

describe('isoDateTime', () => {
  test('turns an ISO date and time in UTC into the same instant', () => {
    expect(isoDateTime.parse('2026-11-26T08:30:00Z')).toEqual(
      new Date(Date.UTC(2026, 10, 26, 8, 30)),
    )
  })

  test('keeps the instant of a date and time with an offset', () => {
    expect(isoDateTime.parse('2026-11-26T09:30:00.250+01:00')).toEqual(
      new Date(Date.UTC(2026, 10, 26, 8, 30, 0, 250)),
    )
  })

  test('refuses a string that is not a date', () => {
    expect(isoDateTime.safeParse('not a date').success).toBe(false)
  })

  test('refuses a date without a time', () => {
    expect(isoDateTime.safeParse('2026-11-26').success).toBe(false)
  })
})
