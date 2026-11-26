import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router'

import { Button, buttonVariants } from '@portflow/design-system/atoms/button'
import {
  ErrorState,
  ErrorStateActions,
  ErrorStateMessage,
} from '@portflow/design-system/atoms/error-state'
import {
  LoadingState,
  LoadingStateLabel,
  LoadingStatePlaceholder,
} from '@portflow/design-system/atoms/loading-state'
import { PageLayout, PageLayoutTitle } from '@portflow/design-system/templates/page-layout'

import { ApiError } from '@/shared/api/problem'
import { PAGE_LABELS } from '@/shared/lib/constants'

/** What a route shows while its loader waits for the data of the page. */
export function RoutePending() {
  return (
    <PageLayout>
      <LoadingState>
        <LoadingStateLabel>{PAGE_LABELS.loading}</LoadingStateLabel>
        <LoadingStatePlaceholder />
      </LoadingState>
    </PageLayout>
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
    <PageLayout>
      <ErrorState>
        <ErrorStateMessage>
          {error instanceof ApiError ? error.label : PAGE_LABELS.unexpectedError}
        </ErrorStateMessage>
        <ErrorStateActions>
          <Button variant="outline" onClick={retry}>
            {PAGE_LABELS.retry}
          </Button>
        </ErrorStateActions>
      </ErrorState>
    </PageLayout>
  )
}

/** What the router shows for a path that matches no route. */
export function RouteNotFound() {
  return (
    <PageLayout>
      <PageLayoutTitle>{PAGE_LABELS.notFound}</PageLayoutTitle>
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        {PAGE_LABELS.home}
      </Link>
    </PageLayout>
  )
}
