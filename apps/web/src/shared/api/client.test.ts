import { describe, expect, test } from 'vitest'

import { unwrap } from './client'
import { ApiError } from './problem'

function answer<Data>(data: Data | undefined, error: unknown, status: number) {
  return Promise.resolve({ data, error, response: new Response(null, { status }) })
}

describe('unwrap', () => {
  test('returns the data of a successful answer', async () => {
    await expect(unwrap(answer({ status: 'up' }, undefined, 200))).resolves.toEqual({
      status: 'up',
    })
  })

  test('accepts a successful answer without a body', async () => {
    await expect(unwrap(answer(undefined, undefined, 204))).resolves.toBeUndefined()
  })

  test('throws the code of the problem the API answered', async () => {
    const problem = { code: 'DATABASE_UNAVAILABLE', status: 503 }

    await expect(unwrap(answer(undefined, problem, 503))).rejects.toMatchObject({
      code: 'DATABASE_UNAVAILABLE',
    })
  })

  test('throws an error without code when the answer is not a problem', async () => {
    await expect(unwrap(answer(undefined, 'Bad Gateway', 502))).rejects.toMatchObject({
      code: null,
    })
  })

  test('throws an error without code when the request fails', async () => {
    const error = await unwrap(Promise.reject(new TypeError('fetch failed'))).catch(
      (thrown: unknown) => thrown,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: null })
  })

  test('lets a cancelled request keep its own error', async () => {
    const aborted = new DOMException('aborted', 'AbortError')

    await expect(unwrap(Promise.reject(aborted))).rejects.toBe(aborted)
  })

  test('lets a cancelled request keep its error when it comes from another realm', async () => {
    // The `fetch` of Node rejects with its own `DOMException`, not the one of jsdom.
    const aborted = Object.assign(new Error('aborted'), { name: 'AbortError' })

    await expect(unwrap(Promise.reject(aborted))).rejects.toBe(aborted)
  })
})
