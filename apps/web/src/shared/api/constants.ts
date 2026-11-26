import type { FieldErrorCode, ProblemCode } from './problem'

/**
 * The label shown for each error of the API, keyed by its stable code (ADR 0015): the
 * build breaks when a code of the contract has no label.
 */
export const PROBLEM_LABELS: Record<ProblemCode, string> = {
  NOT_FOUND: 'What you asked for does not exist.',
  METHOD_NOT_ALLOWED: 'This action is not allowed.',
  INVALID_REQUEST: 'The request is not valid.',
  DATABASE_UNAVAILABLE: 'The database does not answer. Try again in a moment.',
  INTERNAL_ERROR: 'Something went wrong on the server. Try again in a moment.',
  VALIDATION_FAILED: 'Some fields are not valid. Correct them and try again.',
}

/**
 * The label shown under a field the API refused, keyed by the code of the refusal
 * (ADR 0021): the build breaks when a code of the contract has no label.
 */
export const FIELD_ERROR_LABELS: Record<FieldErrorCode, string> = {
  REQUIRED: 'This field is required.',
  INVALID_FORMAT: 'This value cannot be read.',
  OUT_OF_RANGE: 'This value is out of range.',
  TOO_LONG: 'This value is too long.',
}

/** The label shown under a field refused with a code this build does not know. */
export const UNKNOWN_FIELD_ERROR_LABEL = 'This value is not valid.'

/**
 * The label shown when the API answers a problem whose code this build does not know:
 * a newer API, which a reload of the page catches up with.
 */
export const REFUSED_LABEL = 'The server refused the request. Reload the page and try again.'

/** The label shown when the API cannot be reached or answers something else than a problem. */
export const UNREACHABLE_LABEL = 'The service cannot be reached. Try again in a moment.'
