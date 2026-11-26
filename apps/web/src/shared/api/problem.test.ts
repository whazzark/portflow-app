import type { DefaultError } from '@tanstack/react-query'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { FIELD_ERROR_LABELS, UNKNOWN_FIELD_ERROR_LABEL } from './constants'
import { ApiError, isTransient, toApiError } from './problem'

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

describe('toApiError', () => {
  const problem = {
    type: 'about:blank',
    title: 'Unprocessable Entity',
    status: 422,
    detail: 'Some fields of the request body are not valid',
    code: 'VALIDATION_FAILED',
  }

  test('keeps each refused field of the body, with the label of its code', () => {
    const error = toApiError({
      ...problem,
      errors: [
        { pointer: '/tonnage', code: 'OUT_OF_RANGE' },
        { pointer: '/name', code: 'REQUIRED' },
      ],
    })

    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.fieldErrors).toEqual([
      { pointer: '/tonnage', label: FIELD_ERROR_LABELS.OUT_OF_RANGE },
      { pointer: '/name', label: FIELD_ERROR_LABELS.REQUIRED },
    ])
  })

  test('has no field error when the problem names no field', () => {
    expect(toApiError(problem).fieldErrors).toEqual([])
    expect(toApiError({ ...problem, code: 'NOT_FOUND', status: 404 }).fieldErrors).toEqual([])
  })

  test('gives a field error whose code this build does not know a general label', () => {
    const error = toApiError({ ...problem, errors: [{ pointer: '/tonnage', code: 'NEWER_CODE' }] })

    expect(error.fieldErrors).toEqual([{ pointer: '/tonnage', label: UNKNOWN_FIELD_ERROR_LABEL }])
  })

  test('ignores the entries of errors that are not a field error', () => {
    const error = toApiError({
      ...problem,
      errors: ['/tonnage', { pointer: 3, code: 'REQUIRED' }, { code: 'REQUIRED' }, null],
    })

    expect(error.fieldErrors).toEqual([])
  })

  test('ignores errors when it is not a list', () => {
    expect(toApiError({ ...problem, errors: { pointer: '/tonnage' } }).fieldErrors).toEqual([])
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
