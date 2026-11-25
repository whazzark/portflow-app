//! `GET /api/health`: whether the service and its database are up.
//!
//! A health check has no rule of the business, so it calls `infrastructure`
//! directly, without a use case or a port.

mod dto;

use axum::Json;
use axum::Router;
use axum::extract::State;
use axum::routing::get;
use infrastructure::database;

pub use dto::{ComponentStatusDto, HealthResponse};

use crate::problem::{PROBLEM_CONTENT_TYPE, Problem};
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
        (status = 500, description = "Internal error", body = Problem, content_type = PROBLEM_CONTENT_TYPE),
        (status = 503, description = "The database does not answer", body = Problem, content_type = PROBLEM_CONTENT_TYPE),
    )
)]
pub async fn get_health(State(state): State<AppState>) -> Result<Json<HealthResponse>, Problem> {
    if database::ping(&state.pool).await {
        Ok(Json(HealthResponse::new(true)))
    } else {
        Err(Problem::database_unavailable())
    }
}
