import type { components } from '@portflow/contracts'

type HealthResponse = components['schemas']['HealthResponse']

/** What the health screen shows: whether each component is up. */
export type HealthStatus = {
  serviceUp: boolean
  databaseUp: boolean
}

export function toHealthStatus(response: HealthResponse): HealthStatus {
  return { serviceUp: response.status === 'up', databaseUp: response.database === 'up' }
}
