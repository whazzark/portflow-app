import { queryOptions } from '@tanstack/react-query'

import { apiClient, unwrap } from '@/shared/api/client'

import { healthAnswerSchema, toHealthStatus } from '../model/health'
import { healthQueryKeys } from './health-query-keys'

/**
 * The read of the health of the service (`GET /api/health`). The loader of `/` awaits
 * it with `ensureQueryData`, and `HealthPage` reads it with `useSuspenseQuery`: both use
 * these options, so they share one cache entry, under `healthQueryKeys.get()`. The
 * cache keeps the answer of the API parsed by its schema (ADR 0019), and an answer that
 * does not match it fails the read; `select` gives the page its screen type.
 */
export const healthQuery = () =>
  queryOptions({
    queryKey: healthQueryKeys.get(),
    queryFn: async ({ signal }) =>
      healthAnswerSchema.parse(await unwrap(apiClient.GET('/api/health', { signal }))),
    select: toHealthStatus,
  })
