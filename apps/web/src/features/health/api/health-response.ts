import { z } from 'zod'

import type { components } from '@portflow/contracts'

import { contractSchema } from '@/shared/api/contract-schema'

const componentStatus = z.enum(['up', 'down'])

/**
 * The schema of the response of `GET /api/health`, parsed by its `queryFn` (ADR 0020).
 * Its input is the `HealthResponse` of the contract: a change of one without the other
 * fails the build.
 */
export const healthResponseSchema = contractSchema<components['schemas']['HealthResponse']>()(
  z.object({ status: componentStatus, database: componentStatus }),
)

/** The response of the health once parsed: what the cache holds. */
export type HealthResponse = z.output<typeof healthResponseSchema>
