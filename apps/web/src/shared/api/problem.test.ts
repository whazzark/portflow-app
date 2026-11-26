import type { DefaultError } from '@tanstack/react-query'
import { describe, expect, expectTypeOf, test } from 'vitest'

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

// The cases below that the build must refuse are marked `@ts-expect-error`: `pnpm build`
// type checks the tests, and fails if one of them compiles.
describe('the error of a query', () => {
  test('is any error, not only an error of the API', () => {
    expectTypeOf<DefaultError>().toEqualTypeOf<Error>()
  })

  test('is narrowed to an ApiError before its label and code are read', () => {
    const error: DefaultError = new ApiError('NOT_FOUND')

    // @ts-expect-error a read also throws errors that do not come from the API
    expect(error.code).toBe('NOT_FOUND')
    expect(error instanceof ApiError && error.code).toBe('NOT_FOUND')
  })
})
