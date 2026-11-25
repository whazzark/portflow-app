use domain::status::{ComponentStatus, ServiceStatus};
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
pub struct ServiceStatusResponse {
    /// `up` when every component is up.
    pub status: ComponentStatusDto,
    pub database: ComponentStatusDto,
}

impl From<ComponentStatus> for ComponentStatusDto {
    fn from(status: ComponentStatus) -> Self {
        match status {
            ComponentStatus::Up => Self::Up,
            ComponentStatus::Down => Self::Down,
        }
    }
}

impl From<ServiceStatus> for ServiceStatusResponse {
    fn from(status: ServiceStatus) -> Self {
        Self {
            status: status.overall().into(),
            database: status.database.into(),
        }
    }
}
