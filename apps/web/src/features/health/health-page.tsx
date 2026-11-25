import { useSuspenseQuery } from '@tanstack/react-query'

import { healthQuery } from './api/health-query'
import { HealthTable } from './components/health-table'
import { HEALTH_LABELS } from './constants'

/**
 * The health of the service: a technical screen of the walking skeleton (#11). Its
 * route waits for the data; loading and errors are the states of the route.
 */
export function HealthPage() {
  const { data: status } = useSuspenseQuery(healthQuery())

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{HEALTH_LABELS.title}</h1>
      <HealthTable status={status} />
    </main>
  )
}
