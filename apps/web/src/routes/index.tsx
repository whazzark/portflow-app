import { createFileRoute } from '@tanstack/react-router'

import { healthQuery } from '@/features/health/api/health-query'
import { HealthPage } from '@/features/health/health-page'

export const Route = createFileRoute('/')({
  // The page has nothing to show without the health: the route waits for it.
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(healthQuery())
  },
  component: HealthPage,
})
