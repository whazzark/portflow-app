# 0019. Zod at the edge of the web app

Status: accepted (2026-11-26)

Completes ADR 0003, which types the answers of the API with the types generated from
the contract, and ADR 0017, whose `queryFn` returns the answer of the client as it is.

## Context

The types generated from the contract describe the JSON the API sends, not the values
the screens need: a date is an ISO string on the wire, and the screens want a `Date`.
Without a parse, each screen converts what it reads, and the cache of TanStack Query
holds raw JSON that nothing has checked: an answer that differs from the contract (an
API deployed after the page was loaded, a proxy) reaches the screens unnoticed. The
question was raised in #11 and settled with the maintainer in #35.

## Decision

- The web app parses each answer of the API with a Zod schema, Zod 4 with its classic
  API (`import { z } from 'zod'`).
- The schemas are written by hand, one per answer, in `features/<context>/model/`,
  next to the screen types and the mappers. No generator.
- The input of each schema is bound to the generated type of the answer with
  `contractSchema<components['schemas']['X']>()(schema)` (`src/shared/api/`). It
  compiles only when the input of the schema and the type of the contract accept each
  other, so a change of the contract that the schema does not follow (a required field
  added or removed, a value added to or removed from an enum) fails the build, as the
  generated types already do.
- The schema turns the wire format into values: an ISO string into a `Date` (the shared
  `isoDateTime` of `src/shared/lib/`), a string into a number. The mapper of `model/`
  builds the screen type from the output of the schema.
- The answer is parsed in the `queryFn`, after `unwrap`. The cache holds parsed values,
  and the loader, the page and `select` all see them.
- An answer that does not match its schema is an error of the read: the `ZodError`
  reaches the error state of the route, which shows its general label
  (`PAGE_LABELS.unexpectedError`), and the read is not retried as a transient failure.

## Consequences

- An answer that differs from the contract stops at the edge, in one place, instead of
  breaking a screen further on; a screen never converts a wire value itself.
- Each answer takes a schema written by hand, a few lines more than the generated type
  alone. The binding catches every change of a required field or of an enum, but not
  an optional field added to the contract: the schema ignores it until someone adds it.
- Zod is a runtime dependency of the web app, and adds to the size of its bundle.
- A failed parse is not told apart from a bug in the error state. A dedicated label, or
  the smaller `zod/mini`, can be decided later by a new ADR.
