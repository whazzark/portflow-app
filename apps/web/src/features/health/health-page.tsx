import { useSuspenseQuery } from '@tanstack/react-query'

import { PageLayout, PageLayoutTitle } from '@portflow/design-system/templates/page-layout'

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
    <PageLayout>
      <PageLayoutTitle>{HEALTH_LABELS.title}</PageLayoutTitle>
      <HealthTable status={status} />
    </PageLayout>
  )
}
