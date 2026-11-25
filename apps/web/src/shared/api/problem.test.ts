import { describe, expect, test } from 'vitest'

import { ApiError, isTransient } from './problem'

describe('isTransient', () => {
  test('is true when the API cannot be reached', () => {
    expect(isTransient(new ApiError(null))).toBe(true)
  })

  test('is true when the server failed', () => {
    expect(isTransient(new ApiError('DATABASE_UNAVAILABLE'))).toBe(true)
    expect(isTransient(new ApiError('INTERNAL_ERROR'))).toBe(true)
  })

  test('is false when the request is at fault', () => {
    expect(isTransient(new ApiError('NOT_FOUND'))).toBe(false)
    expect(isTransient(new ApiError('METHOD_NOT_ALLOWED'))).toBe(false)
    expect(isTransient(new ApiError('INVALID_REQUEST'))).toBe(false)
  })

  test('is false when the server refused the request with an unknown code', () => {
    expect(isTransient(new ApiError(null, { refused: true }))).toBe(false)
  })

  test('is false for an error that does not come from the API', () => {
    expect(isTransient(new Error('a bug'))).toBe(false)
  })
})
