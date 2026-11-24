# 0006. Session cookie authentication

Status: accepted (2026-11-24)

Note: this ADR decides how sessions are built. The rules of behaviour it mentions
(which sessions a password change or an access change revokes, what a temporary
session is) are business rules: the spec of authentication decides them, and
`CONTEXT.md` words some of them differently. The text below is kept as it was decided.

## Context

The only client is a browser application served under the same origin as the API.
Business rules apply to sessions themselves (temporary sessions for a forced
password renewal, revocation when access changes).

## Decision

- Server-side sessions stored in PostgreSQL, identified by a random opaque
  identifier in an `HttpOnly`, `Secure`, `SameSite` cookie. No token in browser storage.
- The session is modelled in the domain (`auth` context) behind a `SessionStore` port,
  because its rules are business rules.
- Passwords hashed with Argon2.
- A single extractor in the `api` crate turns the cookie into a `CurrentUser`, which
  every use case receives.
- Explicit CSRF protection on state-changing requests; rate limiting on authentication;
  identical error for unknown account and wrong password; all sessions revoked on
  password change and on access changes.

## Consequences

- Authorization is checked in the application layer with a type, not only in middleware.
- A future native client would need token-based authentication: an additional adapter
  beside the cookie, without touching the domain.
- Authentication is the most sensitive code in the product and gets a reinforced
  security review.
