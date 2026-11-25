import type { components } from '@portflow/contracts'

import { PROBLEM_LABELS, REFUSED_LABEL, UNREACHABLE_LABEL } from './constants'

/** The body of every error the API answers (RFC 9457, ADR 0015). */
export type Problem = components['schemas']['Problem']
export type ProblemCode = components['schemas']['ProblemCode']

type ApiErrorOptions = ErrorOptions & {
  /** The API answered a problem, with a code this build does not know. */
  refused?: boolean
}

/**
 * What a read throws when the API answers an error. `code` is `null` when the answer
 * is not a problem this build knows: no network, a proxy that answered in its place,
 * or a code of a newer API (`refused`).
 */
export class ApiError extends Error {
  readonly code: ProblemCode | null
  readonly refused: boolean

  constructor(code: ProblemCode | null, { refused = false, ...options }: ApiErrorOptions = {}) {
    super(code ?? (refused ? 'REFUSED' : 'UNREACHABLE'), options)
    this.name = 'ApiError'
    this.code = code
    this.refused = refused
  }

  /** The text to show to the user. */
  get label(): string {
    if (this.code !== null) return PROBLEM_LABELS[this.code]
    return this.refused ? REFUSED_LABEL : UNREACHABLE_LABEL
  }
}

/** The error that `openapi-fetch` returned, as an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (!hasCode(error)) return new ApiError(null)
  if (isProblemCode(error.code)) return new ApiError(error.code)
  return new ApiError(null, { refused: true })
}

// The problems where the server, not the request, failed.
const TRANSIENT_CODES: ReadonlySet<ProblemCode> = new Set([
  'DATABASE_UNAVAILABLE',
  'INTERNAL_ERROR',
])

/**
 * Whether a read that failed with `error` can pass if tried again: the API could not
 * be reached, or the server failed. Never a request the API refused, nor a bug.
 */
export function isTransient(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false
  if (error.code === null) return !error.refused
  return TRANSIENT_CODES.has(error.code)
}

function hasCode(value: unknown): value is { code: string } {
  return (
    typeof value === 'object' && value !== null && 'code' in value && typeof value.code === 'string'
  )
}

function isProblemCode(code: string): code is ProblemCode {
  return Object.hasOwn(PROBLEM_LABELS, code)
}

// Every read throws an `ApiError` (see `unwrap`): the error of a query is typed so.
declare module '@tanstack/react-query' {
  // Module augmentation merges declarations, which only an interface does.
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface Register {
    defaultError: ApiError
  }
}
