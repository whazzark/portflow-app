import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { contractSchema } from './contract-schema'

// An answer of the contract, as the generated types describe it.
type Answer = { state: 'up' | 'down'; checkedAt: string }

const state = z.enum(['up', 'down'])

// The cases below that the build must refuse are marked `@ts-expect-error`: `pnpm build`
// type checks the tests, and fails if one of them compiles.
describe('contractSchema', () => {
  test('returns the schema when its input is the answer of the contract', () => {
    const schema = contractSchema<Answer>()(
      z.object({ state, checkedAt: z.string().transform((value) => value.length) }),
    )

    expect(schema.parse({ state: 'up', checkedAt: 'now' })).toEqual({ state: 'up', checkedAt: 3 })
  })

  test('refuses a schema that lacks a field of the contract', () => {
    // @ts-expect-error the contract has `checkedAt`
    const schema = contractSchema<Answer>()(z.object({ state }))

    expect(schema).toBeDefined()
  })

  test('refuses a schema that requires a field the contract does not have', () => {
    // @ts-expect-error the contract has no `version`
    const schema = contractSchema<Answer>()(
      z.object({ state, checkedAt: z.string(), version: z.number() }),
    )

    expect(schema).toBeDefined()
  })

  test('refuses a schema that does not accept every value of an enum of the contract', () => {
    // @ts-expect-error the contract also sends `down`
    const schema = contractSchema<Answer>()(
      z.object({ state: z.literal('up'), checkedAt: z.string() }),
    )

    expect(schema).toBeDefined()
  })

  test('refuses a schema that accepts a value the contract does not have', () => {
    const wider = z.enum(['up', 'down', 'degraded'])
    // @ts-expect-error the contract never sends `degraded`
    const schema = contractSchema<Answer>()(z.object({ state: wider, checkedAt: z.string() }))

    expect(schema).toBeDefined()
  })

  test('refuses a schema whose field has another type than in the contract', () => {
    // @ts-expect-error the contract sends `checkedAt` as a string
    const schema = contractSchema<Answer>()(z.object({ state, checkedAt: z.number() }))

    expect(schema).toBeDefined()
  })
})
