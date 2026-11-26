import { z } from 'zod'

import type { components } from '@portflow/contracts'

import { contractSchema } from '@/shared/api/contract-schema'

type HealthResponse = components['schemas']['HealthResponse']

const componentStatus = z.enum(['up', 'down'])

/**
 * The answer of `GET /api/health`, parsed by its `queryFn` (ADR 0019). Its input is the
 * `HealthResponse` of the contract: a change of one without the other fails the build.
 */
export const healthAnswerSchema = contractSchema<HealthResponse>()(
  z.object({ status: componentStatus, database: componentStatus }),
)

/** The answer of the health once parsed: what the cache holds. */
export type HealthAnswer = z.output<typeof healthAnswerSchema>

/** What the health screen shows: whether each component is up. */
export type HealthStatus = {
  serviceUp: boolean
  databaseUp: boolean
}

export function toHealthStatus(answer: HealthAnswer): HealthStatus {
  return { serviceUp: answer.status === 'up', databaseUp: answer.database === 'up' }
}
