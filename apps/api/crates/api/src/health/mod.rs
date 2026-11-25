//! `GET /api/health`: whether the service and its database are up.

mod dto;

use axum::Json;
use axum::Router;
use axum::extract::State;
use axum::http::StatusCode;
use axum::routing::get;
use domain::health::ComponentStatus;

pub use dto::{ComponentStatusDto, HealthResponse};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/api/health", get(get_health))
}

/// Health of the service and of its database.
#[utoipa::path(
    get,
    path = "/api/health",
    tag = "health",
    responses(
        (status = 200, description = "The service and its database are up", body = HealthResponse),
        (status = 503, description = "The database does not answer", body = HealthResponse),
    )
)]
pub async fn get_health(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
    let status = state.get_service_health.execute().await;
    let code = match status.overall() {
        ComponentStatus::Up => StatusCode::OK,
        ComponentStatus::Down => StatusCode::SERVICE_UNAVAILABLE,
    };
    (code, Json(HealthResponse::from(status)))
}
