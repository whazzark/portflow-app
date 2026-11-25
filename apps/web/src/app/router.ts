import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'

/** The router of the app; the loaders reach the query client through its context. */
export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
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
