//! HTTP integration tests: each one calls the whole router, as the binary serves it,
//! against a fresh PostgreSQL database that `sqlx::test` creates and migrates.

// Everything in this crate is test code: `clippy.toml` allows `unwrap` only inside the
// `#[test]` functions, not in the helpers they share.
#![allow(clippy::unwrap_used, clippy::expect_used)]

mod docs;
mod fallbacks;
mod health;
mod support;
