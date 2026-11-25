import { createFileRoute } from '@tanstack/react-router'

import { healthQuery } from '@/features/health/api/health-query'
import { HealthPage } from '@/features/health/health-page'

export const Route = createFileRoute('/')({
  // Starts the read without waiting for it: the page shows its own loading state.
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(healthQuery())
  },
  component: HealthPage,
})
