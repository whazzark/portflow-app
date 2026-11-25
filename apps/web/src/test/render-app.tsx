import { QueryClient } from '@tanstack/react-query'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'

import { App } from '@/app/app'
import { createAppRouter } from '@/app/router'

/**
 * Renders the whole app at `path`, through the real router, with fresh clients. The
 * network is mocked by MSW (`server.use`), never the API client. Queries do not retry,
 * and a route shows its pending state without delay.
 */
export function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createAppRouter(queryClient)
  router.update({
    ...router.options,
    history: createMemoryHistory({ initialEntries: [path] }),
    // The pending state of a route shows at once, not after the delay the app waits.
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
  })
  return render(<App queryClient={queryClient} router={router} />)
}
