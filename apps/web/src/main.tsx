import { QueryClient } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/app'
import { createAppRouter } from '@/app/router'
import { isTransient } from '@/shared/api/problem'

import '@/shared/styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    // One more try, and only for a failure that can pass, so that the route shows its
    // error within about a second rather than after three retries.
    queries: { retry: (failureCount, error) => failureCount < 1 && isTransient(error) },
  },
})
const router = createAppRouter(queryClient)

const root = document.getElementById('root')
if (root === null) throw new Error('index.html has no #root element')

createRoot(root).render(
  <StrictMode>
    <App queryClient={queryClient} router={router} />
  </StrictMode>,
)
