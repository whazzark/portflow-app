import { useQuery } from '@tanstack/react-query'

import { healthQuery } from './api/health-query'
import { HealthTable } from './components/health-table'
import { HEALTH_LABELS } from './constants'

/** The health of the service: a technical screen of the walking skeleton (#11). */
export function HealthPage() {
  const health = useQuery(healthQuery())

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{HEALTH_LABELS.title}</h1>
      {health.isPending && <output className="block">{HEALTH_LABELS.loading}</output>}
      {health.isError && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p>{health.error.label}</p>
          <button
            type="button"
            className="min-h-11 rounded border px-4"
            onClick={() => void health.refetch()}
          >
            {HEALTH_LABELS.retry}
          </button>
        </div>
      )}
      {health.isSuccess && <HealthTable status={health.data} />}
    </main>
  )
}
