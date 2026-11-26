import type { HealthResponse } from '../api/health-response'

/** What the health screen shows: whether each component is up. */
export type HealthStatus = {
  serviceUp: boolean
  databaseUp: boolean
}

export function toHealthStatus(response: HealthResponse): HealthStatus {
  return { serviceUp: response.status === 'up', databaseUp: response.database === 'up' }
}
