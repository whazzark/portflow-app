//! `GET /api/status`: whether the service and its database are up.

mod dto;

use axum::Json;
use axum::Router;
use axum::extract::State;
use axum::http::StatusCode;
use axum::routing::get;

pub use dto::{ComponentStatusDto, ServiceStatusResponse};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/api/status", get(get_status))
}

/// Status of the service and of its database.
#[utoipa::path(
    get,
    path = "/api/status",
    tag = "status",
    responses(
        (status = 200, description = "The service and its database are up", body = ServiceStatusResponse),
        (status = 503, description = "The database does not answer", body = ServiceStatusResponse),
    )
)]
pub async fn get_status(
    State(state): State<AppState>,
) -> (StatusCode, Json<ServiceStatusResponse>) {
    todo!()
}
