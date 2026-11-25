//! `GET /api/health`: whether the service and its database are up.
//!
//! A health check has no rule of the business, so it calls `infrastructure`
//! directly, without a use case or a port.

mod dto;

use axum::Json;
use axum::Router;
use axum::extract::State;
use axum::http::StatusCode;
use axum::routing::get;
use infrastructure::database;

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
    let database_up = database::ping(&state.pool).await;
    let code = if database_up {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };
    (code, Json(HealthResponse::new(database_up)))
}
