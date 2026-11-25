use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
#[schema(as = ComponentStatus)]
#[serde(rename_all = "snake_case")]
pub enum ComponentStatusDto {
    Up,
    Down,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct HealthResponse {
    /// `up` when every component is up.
    pub status: ComponentStatusDto,
    pub database: ComponentStatusDto,
}

impl HealthResponse {
    /// The database is the only component the service depends on, for now.
    pub fn new(database_up: bool) -> Self {
        Self {
            status: ComponentStatusDto::from_up(database_up),
            database: ComponentStatusDto::from_up(database_up),
        }
    }
}

impl ComponentStatusDto {
    fn from_up(up: bool) -> Self {
        if up { Self::Up } else { Self::Down }
    }
}
