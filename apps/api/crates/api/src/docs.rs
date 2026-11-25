//! `GET /api/docs`: the OpenAPI document in a web page (Swagger UI), to browse and try
//! the API from a browser.
//!
//! The page reads `/api/docs/openapi.json`, built from the same document as
//! `contracts/openapi.json`. These routes are not part of the contract.

use axum::Router;
use utoipa_swagger_ui::SwaggerUi;

use crate::openapi;
use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    SwaggerUi::new("/api/docs")
        .url("/api/docs/openapi.json", openapi::document())
        .into()
}
