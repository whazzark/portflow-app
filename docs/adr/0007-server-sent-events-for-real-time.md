# 0007. Server-sent events for real-time updates

Status: accepted (2026-11-24)

## Context

Operations screens must reflect weighings, rotations and downtimes as they happen.
Updates flow from the server to the screens; user actions go through normal requests.

## Decision

- Server-sent events for real-time updates. WebSockets are not used: no
  bidirectional need.
- Use cases publish an event after their transaction commits; the stream relays it.
- Screens treat an event as a signal to refresh the affected queries, not as the data itself.

## Consequences

- Plain HTTP, automatic reconnection by the browser, works with session cookies.
- Updates must not move the screen under the user or interrupt an input in progress.
- With several API instances the in-process broadcaster is no longer enough (see ADR 0005).
