# 0004. React single-page application

Status: accepted (2026-11-24)

## Context

The product is used behind a login, on office desktops (dense tables, filters,
keyboard) and on field tablets and phones (touch, gloves, sunlight, weak network).
There is no SEO need. The API is a separate Rust service using session cookies.

## Decision

- React with TypeScript strict, built with Vite, as a client-side single-page application.
- TanStack Router (file-based routes) and TanStack Query; shadcn/ui components.
- Oxlint and Oxfmt; Vitest, Testing Library and MSW; Playwright end to end.
- Feature-sliced structure (`app`, `routes`, `features`, `shared`) with import
  boundaries checked by lint.
- Served under the same origin as the API.
- Responsive web app designed for touch and offline tolerance on field screens.
  A native app (Expo) is deferred until a native-only need appears.

## Consequences

- No server rendering to operate and no cookie forwarding between servers.
- Same-origin serving avoids CORS; CSRF protection must be handled explicitly.
- Import-boundary rules may rely on Oxlint's JavaScript plugin support; verify its
  maturity, and Oxfmt's, before relying on them.
