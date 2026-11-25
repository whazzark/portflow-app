use api::state::AppState;
use axum::body::Body;
use axum::http::header::{CONTENT_TYPE, LOCATION};
use axum::http::{Request, StatusCode};
use axum::response::Response;
use http_body_util::BodyExt;
use infrastructure::database::PgPool;
use serde_json::Value;
use tower::ServiceExt;

/// The contract the web app generates its types from.
const COMMITTED_CONTRACT: &str = include_str!("../../../../contracts/openapi.json");

async fn get(pool: PgPool, path: &str) -> Response {
    let request = Request::get(path).body(Body::empty()).unwrap();
    api::router(AppState::new(pool))
        .oneshot(request)
        .await
        .unwrap()
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_docs_page_is_served_as_html(pool: PgPool) {
    let response = get(pool, "/api/docs/").await;

    assert_eq!(response.status(), StatusCode::OK);
    let content_type = response.headers()[CONTENT_TYPE].to_str().unwrap();
    assert!(content_type.starts_with("text/html"), "{content_type}");
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_docs_address_without_a_final_slash_redirects_to_the_page(pool: PgPool) {
    let response = get(pool, "/api/docs").await;

    assert_eq!(response.status(), StatusCode::SEE_OTHER);
    assert_eq!(response.headers()[LOCATION], "/api/docs/");
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_docs_page_reads_the_committed_contract(pool: PgPool) {
    let response = get(pool, "/api/docs/openapi.json").await;

    assert_eq!(response.status(), StatusCode::OK);
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let served: Value = serde_json::from_slice(&body).unwrap();
    let committed: Value = serde_json::from_str(COMMITTED_CONTRACT).unwrap();
    assert_eq!(served, committed);
    assert!(served["paths"]["/api/health"]["get"].is_object());
}
