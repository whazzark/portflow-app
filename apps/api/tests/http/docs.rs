use axum::body::Body;
use axum::http::header::{CONTENT_TYPE, LOCATION};
use axum::http::{Request, StatusCode};
use infrastructure::database::PgPool;
use serde_json::Value;

use crate::support::{Answer, call};

/// The contract the web app generates its types from.
const COMMITTED_CONTRACT: &str = include_str!("../../../../contracts/openapi.json");

async fn get(pool: PgPool, path: &str) -> Answer {
    call(pool, Request::get(path).body(Body::empty()).unwrap()).await
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_docs_page_is_served_as_html(pool: PgPool) {
    let answer = get(pool, "/api/docs/").await;

    assert_eq!(answer.status, StatusCode::OK);
    let content_type = answer.headers[CONTENT_TYPE].to_str().unwrap();
    assert!(content_type.starts_with("text/html"), "{content_type}");
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_docs_address_without_a_final_slash_redirects_to_the_page(pool: PgPool) {
    let answer = get(pool, "/api/docs").await;

    assert_eq!(answer.status, StatusCode::SEE_OTHER);
    assert_eq!(answer.headers[LOCATION], "/api/docs/");
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_docs_page_reads_the_committed_contract(pool: PgPool) {
    let answer = get(pool, "/api/docs/openapi.json").await;

    assert_eq!(answer.status, StatusCode::OK);
    let committed: Value = serde_json::from_str(COMMITTED_CONTRACT).unwrap();
    assert_eq!(answer.body, committed);
    assert!(answer.body["paths"]["/api/health"]["get"].is_object());
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn an_unknown_file_of_the_docs_page_answers_a_problem(pool: PgPool) {
    let answer = get(pool, "/api/docs/nope.txt").await;

    assert_eq!(answer.status, StatusCode::NOT_FOUND);
    assert_eq!(answer.body["code"], "NOT_FOUND");
}
