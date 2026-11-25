//! HTTP routes, DTOs, the OpenAPI document and the composition root.

pub mod docs;
pub mod health;
pub mod openapi;
pub mod state;

use axum::Router;

use crate::state::AppState;

/// The whole router of the API, as the binary serves it and the tests call it.
pub fn router(state: AppState) -> Router {
    Router::new()
        .merge(health::routes())
        .merge(docs::routes())
        .with_state(state)
}
