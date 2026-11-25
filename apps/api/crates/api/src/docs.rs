//! `GET /api/docs`: the OpenAPI document in a web page (Swagger UI), to browse and try
//! the API from a browser.
//!
//! The page reads `/api/docs/openapi.json`, built from the same document as
//! `contracts/openapi.json`. These routes are not part of the contract.

use axum::Router;
use axum::http::StatusCode;
use axum::middleware;
use axum::response::{IntoResponse, Response};
use utoipa_swagger_ui::SwaggerUi;

use crate::openapi;
use crate::problem::Problem;
use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    let swagger_ui: Router<AppState> = SwaggerUi::new("/api/docs")
        .url("/api/docs/openapi.json", openapi::document())
        .into();
    swagger_ui.layer(middleware::map_response(unknown_file_as_problem))
}

/// Swagger UI answers a file it does not have with an empty 404: make it a problem,
/// like every other error of the API (ADR 0015).
async fn unknown_file_as_problem(response: Response) -> Response {
    if response.status() == StatusCode::NOT_FOUND {
        Problem::not_found().into_response()
    } else {
        response
    }
}
