//! HTTP routes, DTOs, the OpenAPI document and the composition root.

pub mod docs;
pub mod extract;
pub mod health;
pub mod openapi;
pub mod problem;
pub mod state;

use std::any::Any;

use axum::Router;
use axum::response::{IntoResponse, Response};
use tower_http::catch_panic::CatchPanicLayer;

use crate::problem::Problem;
use crate::state::AppState;

/// The whole router of the API, as the binary serves it and the tests call it.
pub fn router(state: AppState) -> Router {
    let routes = Router::new()
        .merge(health::routes())
        .merge(docs::routes())
        .with_state(state);
    answer_problems(routes)
}

/// Makes the responses Axum produces by itself problems (ADR 0015): unknown route,
/// wrong method, and a handler that panics. It is applied once every route is
/// registered, because the answer to a wrong method is set on the routes that exist.
fn answer_problems(routes: Router) -> Router {
    routes
        .fallback(unknown_route)
        .method_not_allowed_fallback(wrong_method)
        .layer(CatchPanicLayer::custom(panic_to_problem))
}

async fn unknown_route() -> Problem {
    Problem::not_found()
}

async fn wrong_method() -> Problem {
    Problem::method_not_allowed()
}

/// The answer to a handler that panicked. The value of the panic is its cause: it is
/// dropped here, and the panic hook of Rust has already written it to the error output.
fn panic_to_problem(_cause: Box<dyn Any + Send + 'static>) -> Response {
    Problem::internal().into_response()
}

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use axum::routing::get;
    use http_body_util::BodyExt;
    use serde_json::Value;
    use tower::ServiceExt;

    use super::*;
    use crate::problem::PROBLEM_CONTENT_TYPE;

    async fn panicking_handler() {
        panic!("connection string postgres://user:secret@host");
    }

    #[tokio::test]
    async fn a_handler_that_panics_answers_an_internal_error_without_its_cause() {
        let routes = Router::new().route("/panic", get(panicking_handler));
        let request = Request::get("/panic").body(Body::empty()).unwrap();

        let response = answer_problems(routes).oneshot(request).await.unwrap();

        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(
            response.headers()[header::CONTENT_TYPE],
            PROBLEM_CONTENT_TYPE
        );
        let body = response.into_body().collect().await.unwrap().to_bytes();
        assert!(!String::from_utf8_lossy(&body).contains("secret"));
        let problem: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(problem["code"], "INTERNAL_ERROR");
    }
}
