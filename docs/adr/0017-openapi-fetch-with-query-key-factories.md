# 0017. openapi-fetch with query key factories

Status: accepted (2026-11-25)

Completes ADR 0003, which binds the typed client to TanStack Query with
`openapi-react-query`: that library is not used.

## Context

`openapi-react-query` builds the cache key of each read from the method, the path and
the parameters (`['get', '/api/health', params]`), and does not let the caller replace
it. The web app needs the keys of a domain in several places: to prefetch a read in a
route loader, to show a loading screen while a domain is fetching, and to invalidate
every read of a domain after a mutation. Keys that start with a method and a path
cannot be grouped by domain.

## Decision

- The web app calls the API through `openapi-fetch`, typed by the types of
  `@portflow/contracts` (ADR 0016), without `openapi-react-query`.
- Each read is one `queryOptions` of TanStack Query. Its `queryFn` calls the client
  and throws the problem the API answered (ADR 0015); its key comes from a factory.
- Each domain has one key factory, `<context>QueryKeys`, in
  `features/<context>/api/<context>-query-keys.ts`. `all()` is the prefix of the
  domain; every other key starts with it and takes the parameters it needs (an
  identifier, filters). No key is written by hand anywhere else.

```ts
export const healthQueryKeys = {
  all: () => ['health'] as const,
  get: () => [...healthQueryKeys.all(), 'get'] as const,
}
```

## Consequences

- A route loader prefetches with the same `queryOptions` as the component, a loading
  indicator of a domain reads `useIsFetching({ queryKey: <context>QueryKeys.all() })`,
  and a mutation invalidates a domain with its `all()`.
- Each read takes a few more lines than with `openapi-react-query`: the `queryFn`
  unwraps the answer of the client. The types still come from the contract, so an
  API change the web app does not handle still breaks its compilation.
