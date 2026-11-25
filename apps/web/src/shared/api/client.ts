import createClient from 'openapi-fetch'

import type { paths } from '@portflow/contracts'

import { ApiError, toApiError } from './problem'

/**
 * The HTTP client of the API, typed by the contract (ADR 0016, 0017). The API is
 * served under the origin of the page (ADR 0004): every path starts with `/api`.
 */
export const apiClient = createClient<paths>({
  baseUrl: window.location.origin,
  // Reads `fetch` at each call rather than once at import: the tests replace it with
  // the one of MSW after this module is loaded.
  fetch: (request) => globalThis.fetch(request),
})

/**
 * The data of an answer of `apiClient`, for a `queryFn` or a `mutationFn`. Throws an
 * `ApiError` when the API answers an error or cannot be reached; a cancelled request
 * keeps its own error, which TanStack Query expects.
 */
export async function unwrap<Data>(
  call: Promise<{ data?: Data; error?: unknown; response: Response }>,
): Promise<Data> {
  let result: Awaited<typeof call>
  try {
    result = await call
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(null, { cause })
  }
  if (!result.response.ok) throw toApiError(result.error)
  // A successful answer without a body (204) has no data: `Data` is then `undefined`.
  return result.data as Data
}
