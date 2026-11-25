//! Composition root: the only place that chooses the adapter of each port.

use application::status::GetServiceStatus;
use infrastructure::database::PgPool;
use infrastructure::status::PostgresDatabaseProbe;

/// The use cases the routes call, wired to their PostgreSQL adapters.
#[derive(Debug, Clone)]
pub struct AppState {
    pub get_service_status: GetServiceStatus<PostgresDatabaseProbe>,
}

impl AppState {
    pub fn new(pool: PgPool) -> Self {
        Self {
            get_service_status: GetServiceStatus::new(PostgresDatabaseProbe::new(pool)),
        }
    }
}
