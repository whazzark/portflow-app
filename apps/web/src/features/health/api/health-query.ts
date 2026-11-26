import { queryOptions } from '@tanstack/react-query'

import { apiClient, unwrap } from '@/shared/api/client'

import { toHealthStatus } from '../model/health'
import { healthQueryKeys } from './health-query-keys'
import { healthResponseSchema } from './health-response'

/**
 * The read of the health of the service (`GET /api/health`). The loader of `/` awaits
 * it with `ensureQueryData`, and `HealthPage` reads it with `useSuspenseQuery`: both use
 * these options, so they share one cache entry, under `healthQueryKeys.get()`. The
 * cache keeps the response of the API parsed by its schema (ADR 0020), and a response
 * that does not match it fails the read; `select` gives the page its screen type.
 */
export const healthQuery = () =>
  queryOptions({
    queryKey: healthQueryKeys.get(),
    queryFn: async ({ signal }) => {
      const response = await unwrap(apiClient.GET('/api/health', { signal }))
      return healthResponseSchema.parse(response)
    },
    select: toHealthStatus,
  })
