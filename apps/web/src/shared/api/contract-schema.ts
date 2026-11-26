import type { z } from 'zod'

// Whether each of `A` and `B` accepts the other. The tuples keep a union from being
// compared member by member.
type AcceptEachOther<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

/**
 * The schema of a response of the API, bound to its type in the contract (ADR 0020):
 * `contractSchema<components['schemas']['X']>()(z.object({ ... }))`. It returns the
 * schema as it is, and compiles only when the input of the schema and the response
 * of the contract accept each other: a required field added or removed, or a value added
 * to or removed from an enum, on one side only, fails the build. An optional field
 * added to the contract is not caught.
 */
export function contractSchema<ContractResponse>() {
  return <Schema extends z.ZodType>(
    schema: Schema,
    // Required, and so missing from the call, only when the types differ: the error of
    // the compiler then names this parameter.
    ..._check: AcceptEachOther<z.input<Schema>, ContractResponse> extends true
      ? []
      : [error: 'the input of the schema is not the response of the contract']
  ): Schema => schema
}
