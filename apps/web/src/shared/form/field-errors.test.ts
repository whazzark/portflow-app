import { describe, expect, test } from 'vitest'

import { ApiError } from '@/shared/api/problem'

import { toFormErrors } from './field-errors'

type Name = 'name' | 'tonnage'

const FIELDS: Record<string, Name> = { '/name': 'name', '/tonnage': 'tonnage' }

function fieldOf(pointer: string): Name | undefined {
  return FIELDS[pointer]
}

function validationFailed(fieldErrors: { pointer: string; label: string }[]) {
  return new ApiError('VALIDATION_FAILED', { fieldErrors })
}

describe('toFormErrors', () => {
  test('puts the label of each refused field under the field of its pointer', () => {
    const error = validationFailed([
      { pointer: '/tonnage', label: 'This value is out of range.' },
      { pointer: '/name', label: 'This field is required.' },
    ])

    expect(toFormErrors(error, fieldOf)).toEqual({
      fields: { tonnage: 'This value is out of range.', name: 'This field is required.' },
      unmatched: false,
    })
  })

  test('keeps the first error of a field the API refused twice', () => {
    const error = validationFailed([
      { pointer: '/tonnage', label: 'This value is out of range.' },
      { pointer: '/tonnage', label: 'This value cannot be read.' },
    ])

    expect(toFormErrors(error, fieldOf).fields).toEqual({
      tonnage: 'This value is out of range.',
    })
  })

  test('says that a pointer names no field of the form', () => {
    const error = validationFailed([
      { pointer: '/tonnage', label: 'This value is out of range.' },
      { pointer: '/berth', label: 'This field is required.' },
    ])

    expect(toFormErrors(error, fieldOf)).toEqual({
      fields: { tonnage: 'This value is out of range.' },
      unmatched: true,
    })
  })

  test('has no field error for an error that names no field', () => {
    expect(toFormErrors(new ApiError('INTERNAL_ERROR'), fieldOf)).toEqual({
      fields: {},
      unmatched: false,
    })
    expect(toFormErrors(new ApiError(null), fieldOf)).toEqual({ fields: {}, unmatched: false })
  })
})
