//! PostgreSQL adapter of the database probe.

use domain::status::{ComponentStatus, DatabaseProbe};
use sqlx::PgPool;

#[derive(Debug, Clone)]
pub struct PostgresDatabaseProbe {
    pool: PgPool,
}

impl PostgresDatabaseProbe {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl DatabaseProbe for PostgresDatabaseProbe {
    async fn check(&self) -> ComponentStatus {
        todo!()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[sqlx::test(migrator = "crate::database::MIGRATOR")]
    async fn the_database_is_up_when_postgresql_answers(pool: PgPool) {
        let probe = PostgresDatabaseProbe::new(pool);

        assert_eq!(probe.check().await, ComponentStatus::Up);
    }

    #[sqlx::test(migrator = "crate::database::MIGRATOR")]
    async fn the_database_is_down_when_no_connection_can_be_made(pool: PgPool) {
        pool.close().await;
        let probe = PostgresDatabaseProbe::new(pool);

        assert_eq!(probe.check().await, ComponentStatus::Down);
    }
}
