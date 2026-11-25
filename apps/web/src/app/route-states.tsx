import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router'

import { ApiError } from '@/shared/api/problem'
import { PAGE_LABELS } from '@/shared/lib/constants'

/** What a route shows while its loader waits for the data of the page. */
export function RoutePending() {
  return (
    <main className="mx-auto max-w-xl p-4">
      <output className="block">{PAGE_LABELS.loading}</output>
    </main>
  )
}

/**
 * What a route shows when its loader, or a suspended query of the page, failed: the
 * label of the error of the API, or a general one for any other error (a bug, not the
 * network). Trying again clears the failed queries and runs the loaders again.
 */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  function retry() {
    queryErrorResetBoundary.reset()
    void router.invalidate()
  }

  return (
    <main className="mx-auto max-w-xl p-4">
      <div role="alert" className="flex flex-col items-start gap-2">
        <p>{error instanceof ApiError ? error.label : PAGE_LABELS.unexpectedError}</p>
        <button type="button" className="min-h-11 rounded border px-4" onClick={retry}>
          {PAGE_LABELS.retry}
        </button>
      </div>
    </main>
  )
}

/** What the router shows for a path that matches no route. */
export function RouteNotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 p-4">
      <h1 className="text-2xl font-semibold">{PAGE_LABELS.notFound}</h1>
      <Link to="/" className="underline">
        {PAGE_LABELS.home}
      </Link>
    </main>
  )
}
