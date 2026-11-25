import { queryOptions } from '@tanstack/react-query'

import { apiClient, unwrap } from '@/shared/api/client'

import { toHealthStatus } from '../model/health'
import { healthQueryKeys } from './health-query-keys'

/**
 * The read of the health of the service (`GET /api/health`). The loader of `/` awaits
 * it with `ensureQueryData`, and `HealthPage` reads it with `useSuspenseQuery`: both use
 * these options, so they share one cache entry, under `healthQueryKeys.get()`. The
 * cache keeps the answer of the API; `select` gives the page its screen type.
 */
export const healthQuery = () =>
  queryOptions({
    queryKey: healthQueryKeys.get(),
    queryFn: ({ signal }) => unwrap(apiClient.GET('/api/health', { signal })),
    select: toHealthStatus,
  })
