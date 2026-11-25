//! Composition root: the only place that chooses the adapter of each port.

use infrastructure::database::PgPool;

/// What the routes need: for now, the pool for the health check.
#[derive(Debug, Clone)]
pub struct AppState {
    pub pool: PgPool,
}

impl AppState {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}
