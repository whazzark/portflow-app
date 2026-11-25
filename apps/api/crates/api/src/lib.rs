//! HTTP routes, DTOs, the OpenAPI document and the composition root.

pub mod state;
pub mod status;

use axum::Router;

use crate::state::AppState;

/// The whole router of the API, as the binary serves it and the tests call it.
pub fn router(state: AppState) -> Router {
    Router::new().merge(status::routes()).with_state(state)
}
