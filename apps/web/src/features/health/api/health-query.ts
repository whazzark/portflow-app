import { queryOptions } from '@tanstack/react-query'

import { apiClient, unwrap } from '@/shared/api/client'

import { toHealthStatus } from '../model/health'
import { healthQueryKeys } from './health-query-keys'

/** The health of the service: prefetched by the route, read by the page. */
export const healthQuery = () =>
  queryOptions({
    queryKey: healthQueryKeys.get(),
    queryFn: ({ signal }) => unwrap(apiClient.GET('/api/health', { signal })),
    select: toHealthStatus,
  })
