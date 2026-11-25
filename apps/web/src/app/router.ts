import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'

import { RouteError, RouteNotFound, RoutePending } from './route-states'

/**
 * The router of the app. Its loaders reach TanStack Query through the context: each one
 * awaits the data of its page with `ensureQueryData`, and the page reads it with
 * `useSuspenseQuery` (`.claude/rules/frontend.md`, State).
 */
export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    // Hovering or focusing a link runs the loader of its route ahead of the click.
    defaultPreload: 'intent',
    // The states every route shows: while its loader waits (after `defaultPendingMs`,
    // 1s), when the loader or the page fails, and for a path that matches no route.
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
    // The router keeps no data of its own, so a preload always runs the loader; the
    // data is cached once, by TanStack Query, which `ensureQueryData` reads first.
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
