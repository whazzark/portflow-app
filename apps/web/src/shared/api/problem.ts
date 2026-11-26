import type { components } from '@portflow/contracts'

import {
  FIELD_ERROR_LABELS,
  PROBLEM_LABELS,
  REFUSED_LABEL,
  UNKNOWN_FIELD_ERROR_LABEL,
  UNREACHABLE_LABEL,
} from './constants'

/** The body of every error the API answers (RFC 9457, ADR 0015). */
export type Problem = components['schemas']['Problem']
export type ProblemCode = components['schemas']['ProblemCode']
export type FieldErrorCode = components['schemas']['FieldErrorCode']

/** A field of the request body the API refused (ADR 0021). */
export type ApiFieldError = {
  /** A JSON Pointer into the body of the request, such as `/tonnage`. */
  pointer: string
  /** The text to show under the field. */
  label: string
}

type ApiErrorOptions = ErrorOptions & {
  /** The API answered a problem, with a code this build does not know. */
  refused?: boolean
  /** The fields of the request body the problem names. */
  fieldErrors?: Readonly<ApiFieldError[]>
}

/**
 * What a read throws when the API answers an error. `code` is `null` when the answer
 * is not a problem this build knows: no network, a proxy that answered in its place,
 * or a code of a newer API (`refused`).
 */
export class ApiError extends Error {
  readonly code: ProblemCode | null
  readonly refused: boolean
  /** The fields of the request body the API refused; empty when it names none. */
  readonly fieldErrors: Readonly<ApiFieldError[]>

  constructor(
    code: ProblemCode | null,
    { refused = false, fieldErrors = [], ...options }: ApiErrorOptions = {},
  ) {
    super(code ?? (refused ? 'REFUSED' : 'UNREACHABLE'), options)
    this.name = 'ApiError'
    this.code = code
    this.refused = refused
    this.fieldErrors = fieldErrors
  }

  /** The text to show to the user. */
  get label(): string {
    if (this.code !== null) {
      return PROBLEM_LABELS[this.code]
    }

    return this.refused ? REFUSED_LABEL : UNREACHABLE_LABEL
  }
}

/** The error that `openapi-fetch` returned, as an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (!hasCode(error)) {
    return new ApiError(null)
  }
  if (isProblemCode(error.code)) {
    return new ApiError(error.code, { fieldErrors: readFieldErrors(error) })
  }

  return new ApiError(null, { refused: true })
}

// The `errors` member of a problem; an entry that is not a field error is dropped.
function readFieldErrors(problem: object): ApiFieldError[] {
  if (!('errors' in problem) || !Array.isArray(problem.errors)) {
    return []
  }

  return problem.errors.filter(isFieldError).map(({ pointer, code }) => ({
    pointer,
    label: isFieldErrorCode(code) ? FIELD_ERROR_LABELS[code] : UNKNOWN_FIELD_ERROR_LABEL,
  }))
}

/** An entry of the `errors` member of a problem, with a code this build may not know. */
type ProblemFieldError = { pointer: string; code: string }

function isFieldError(value: unknown): value is ProblemFieldError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pointer' in value &&
    typeof value.pointer === 'string' &&
    'code' in value &&
    typeof value.code === 'string'
  )
}

function isFieldErrorCode(code: string): code is FieldErrorCode {
  return Object.hasOwn(FIELD_ERROR_LABELS, code)
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
  if (!(error instanceof ApiError)) {
    return false
  }
  if (error.code === null) {
    return !error.refused
  }

  return TRANSIENT_CODES.has(error.code)
}

/** An error body that carries a `code`, known to this build or not. */
type ErrorWithCode = { code: string }

function hasCode(value: unknown): value is ErrorWithCode {
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
