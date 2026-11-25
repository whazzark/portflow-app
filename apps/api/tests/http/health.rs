use axum::body::Body;
use axum::http::{Request, StatusCode};
use infrastructure::database::PgPool;
use serde_json::json;

use crate::support::{Answer, call};

async fn get_health(pool: PgPool) -> Answer {
    call(
        pool,
        Request::get("/api/health").body(Body::empty()).unwrap(),
    )
    .await
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_service_is_healthy_when_the_database_answers(pool: PgPool) {
    let answer = get_health(pool).await;

    assert_eq!(answer.status, StatusCode::OK);
    assert_eq!(answer.body, json!({ "status": "up", "database": "up" }));
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_service_answers_a_problem_when_the_database_does_not_answer(pool: PgPool) {
    pool.close().await;

    let answer = get_health(pool).await;

    assert_eq!(answer.status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(
        answer.body,
        json!({
            "type": "about:blank",
            "title": "Service Unavailable",
            "status": 503,
            "detail": "The database does not answer",
            "code": "DATABASE_UNAVAILABLE"
        })
    );
}
