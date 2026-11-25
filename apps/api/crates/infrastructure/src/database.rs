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

/// Whether PostgreSQL answers a query. A failure is an answer, not an error: the
/// health check reports it. The error stops here, so it is logged here.
pub async fn ping(pool: &PgPool) -> bool {
    match sqlx::query("SELECT 1").execute(pool).await {
        Ok(_) => true,
        Err(error) => {
            tracing::error!(%error, "database ping failed");
            false
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[sqlx::test(migrator = "crate::database::MIGRATOR")]
    async fn ping_succeeds_when_postgresql_answers(pool: PgPool) {
        assert!(ping(&pool).await);
    }

    #[sqlx::test(migrator = "crate::database::MIGRATOR")]
    async fn ping_fails_when_no_connection_can_be_made(pool: PgPool) {
        pool.close().await;

        assert!(!ping(&pool).await);
    }
}
