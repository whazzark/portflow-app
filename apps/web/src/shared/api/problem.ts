import type { components } from '@portflow/contracts'

import { PROBLEM_LABELS, UNREACHABLE_LABEL } from './constants'

/** The body of every error the API answers (RFC 9457, ADR 0015). */
export type Problem = components['schemas']['Problem']
export type ProblemCode = components['schemas']['ProblemCode']

/**
 * What a read throws when the API answers an error. `code` is `null` when the answer
 * is not a problem of the API: no network, or a proxy that answered in its place.
 */
export class ApiError extends Error {
  readonly code: ProblemCode | null

  constructor(code: ProblemCode | null) {
    super(code ?? 'UNREACHABLE')
    this.name = 'ApiError'
    this.code = code
  }

  /** The text to show to the user. */
  get label(): string {
    return this.code === null ? UNREACHABLE_LABEL : PROBLEM_LABELS[this.code]
  }
}

/** The error that `openapi-fetch` returned, as an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  return new ApiError(isProblem(error) ? error.code : null)
}

function isProblem(value: unknown): value is Problem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'string' &&
    Object.hasOwn(PROBLEM_LABELS, value.code)
  )
}
