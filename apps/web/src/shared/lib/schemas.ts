import { z } from 'zod'

/**
 * A date and time of the API, sent as an ISO 8601 string with `Z` or an offset, as a
 * `Date` (ADR 0020). Its input is a `string`, the type the contract gives it.
 */
export const isoDateTime = z.iso.datetime({ offset: true }).transform((value) => new Date(value))
