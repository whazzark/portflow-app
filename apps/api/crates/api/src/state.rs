//! Composition root: the only place that chooses the adapter of each port.

use application::health::GetServiceHealth;
use infrastructure::database::PgPool;
use infrastructure::health::PostgresDatabaseProbe;

/// The use cases the routes call, wired to their PostgreSQL adapters.
#[derive(Debug, Clone)]
pub struct AppState {
    pub get_service_health: GetServiceHealth<PostgresDatabaseProbe>,
}

impl AppState {
    pub fn new(pool: PgPool) -> Self {
        Self {
            get_service_health: GetServiceHealth::new(PostgresDatabaseProbe::new(pool)),
        }
    }
}
