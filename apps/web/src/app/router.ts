import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'

import { RouteError, RoutePending } from './route-states'

/** The router of the app; the loaders reach the query client through its context. */
export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    // A loader waits for the data of its page (`ensureQueryData`) and the page reads it
    // with `useSuspenseQuery`: the route shows these states meanwhile and on failure.
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: RouteError,
    // The loaders only prefetch: the cache of TanStack Query decides what is fresh.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  // Module augmentation merges declarations, which only an interface does.
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
