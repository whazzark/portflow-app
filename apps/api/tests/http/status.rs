use api::state::AppState;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use infrastructure::database::PgPool;
use serde_json::{Value, json};
use tower::ServiceExt;

/// Calls `GET /api/status` and returns the status code and the JSON body.
async fn get_status(pool: PgPool) -> (StatusCode, Value) {
    let request = Request::get("/api/status").body(Body::empty()).unwrap();
    let response = api::router(AppState::new(pool))
        .oneshot(request)
        .await
        .unwrap();

    let code = response.status();
    let body = response.into_body().collect().await.unwrap().to_bytes();
    (code, serde_json::from_slice(&body).unwrap())
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_status_is_up_when_the_database_answers(pool: PgPool) {
    let (code, body) = get_status(pool).await;

    assert_eq!(code, StatusCode::OK);
    assert_eq!(body, json!({ "status": "up", "database": "up" }));
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_status_is_unavailable_when_the_database_does_not_answer(pool: PgPool) {
    pool.close().await;

    let (code, body) = get_status(pool).await;

    assert_eq!(code, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(body, json!({ "status": "down", "database": "down" }));
}
