//! The connection pool and the migrations of PostgreSQL.

use std::time::Duration;

use sqlx::migrate::{MigrateError, Migrator};
use sqlx::postgres::PgPoolOptions;

/// The pool of connections to PostgreSQL, shared by every adapter.
pub use sqlx::PgPool;

/// The migrations of `apps/api/migrations/`, embedded in the binary at build time.
pub static MIGRATOR: Migrator = sqlx::migrate!("../../migrations");

/// How long a request waits for a connection before the database counts as down.
const ACQUIRE_TIMEOUT: Duration = Duration::from_secs(3);

#[derive(Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("invalid DATABASE_URL: {0}")]
    InvalidUrl(#[source] sqlx::Error),
    #[error("cannot run the migrations: {0}")]
    Migration(#[source] MigrateError),
}

/// Creates the pool without connecting: the API starts even while PostgreSQL is
/// down, and its health check says so.
pub fn connect(database_url: &str) -> Result<PgPool, DatabaseError> {
    PgPoolOptions::new()
        .acquire_timeout(ACQUIRE_TIMEOUT)
        .connect_lazy(database_url)
        .map_err(DatabaseError::InvalidUrl)
}

/// Applies the migrations that are not applied yet, in order.
pub async fn migrate(pool: &PgPool) -> Result<(), DatabaseError> {
    MIGRATOR.run(pool).await.map_err(DatabaseError::Migration)
}
