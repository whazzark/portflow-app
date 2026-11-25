//! The answers no handler writes: unknown route and wrong method.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use infrastructure::database::PgPool;

use crate::support::call;

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn an_unknown_route_answers_a_problem(pool: PgPool) {
    let request = Request::get("/api/nope").body(Body::empty()).unwrap();

    let answer = call(pool, request).await;

    assert_eq!(answer.status, StatusCode::NOT_FOUND);
    assert_eq!(answer.body["code"], "NOT_FOUND");
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn a_wrong_method_answers_a_problem(pool: PgPool) {
    let request = Request::post("/api/health").body(Body::empty()).unwrap();

    let answer = call(pool, request).await;

    assert_eq!(answer.status, StatusCode::METHOD_NOT_ALLOWED);
    assert_eq!(answer.body["code"], "METHOD_NOT_ALLOWED");
}
