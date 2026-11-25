//! What the API logs for a request, and the identifier it gives to each one.

use std::io;
use std::sync::{Arc, Mutex};

use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use infrastructure::database::PgPool;
use serde_json::Value;
use tracing::subscriber::DefaultGuard;

use crate::support::{Answer, call};

const REQUEST_ID: &str = "x-request-id";

/// Where the logs of one test are written, instead of the standard output.
#[derive(Clone, Default)]
struct Captured(Arc<Mutex<Vec<u8>>>);

impl io::Write for Captured {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        self.0.lock().unwrap().extend_from_slice(bytes);
        Ok(bytes.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

impl Captured {
    /// Everything that was logged, as written.
    fn text(&self) -> String {
        String::from_utf8(self.0.lock().unwrap().clone()).unwrap()
    }

    /// One JSON object per event.
    fn events(&self) -> Vec<Value> {
        self.text()
            .lines()
            .map(|line| serde_json::from_str(line).unwrap())
            .collect()
    }

    /// The events with this message.
    fn events_saying(&self, message: &str) -> Vec<Value> {
        self.events()
            .into_iter()
            .filter(|event| event["message"] == message)
            .collect()
    }
}

/// Captures, in the JSON format of the API, what this test logs until the guard is
/// dropped. `sqlx::test` runs each test on its own thread, so the tests do not mix.
fn capture_logs() -> (DefaultGuard, Captured) {
    let captured = Captured::default();
    let writer = captured.clone();
    let subscriber = tracing_subscriber::fmt()
        .json()
        .flatten_event(true)
        .with_span_list(false)
        .with_writer(move || writer.clone())
        .finish();
    (tracing::subscriber::set_default(subscriber), captured)
}

fn request_id(answer: &Answer) -> String {
    answer.headers[REQUEST_ID].to_str().unwrap().to_owned()
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn every_answer_carries_a_request_identifier(pool: PgPool) {
    let health = Request::get("/api/health").body(Body::empty()).unwrap();
    let unknown = Request::get("/api/nope").body(Body::empty()).unwrap();

    let first = call(pool.clone(), health).await;
    let second = call(pool, unknown).await;

    assert!(!request_id(&first).is_empty());
    assert!(!request_id(&second).is_empty());
    assert_ne!(request_id(&first), request_id(&second));
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn the_request_identifier_of_the_client_is_replaced(pool: PgPool) {
    let request = Request::get("/api/health")
        .header(REQUEST_ID, "chosen-by-the-client")
        .body(Body::empty())
        .unwrap();

    let answer = call(pool, request).await;

    assert_ne!(request_id(&answer), "chosen-by-the-client");
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn a_request_is_logged_once_with_its_method_path_status_duration_and_identifier(
    pool: PgPool,
) {
    let (_guard, logs) = capture_logs();
    let request = Request::get("/api/health").body(Body::empty()).unwrap();

    let answer = call(pool, request).await;

    let events = logs.events_saying("request completed");
    assert_eq!(events.len(), 1, "logged: {}", logs.text());
    let event = &events[0];
    assert_eq!(event["level"], "INFO");
    assert_eq!(event["status"], 200);
    assert!(event["duration_ms"].is_u64());
    assert_eq!(event["span"]["method"], "GET");
    assert_eq!(event["span"]["path"], "/api/health");
    assert_eq!(event["span"]["request_id"], request_id(&answer));
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn no_credential_cookie_query_or_body_is_logged(pool: PgPool) {
    let (_guard, logs) = capture_logs();
    let request = Request::get("/api/health?token=secret-in-the-query")
        .header(header::COOKIE, "session=secret-in-the-cookie")
        .header(header::AUTHORIZATION, "Bearer secret-in-the-credential")
        .header(REQUEST_ID, "secret-in-the-identifier")
        .body(Body::from("secret-in-the-body"))
        .unwrap();

    let answer = call(pool, request).await;

    assert_eq!(answer.status, StatusCode::OK);
    assert_eq!(logs.events_saying("request completed").len(), 1);
    assert!(!logs.text().contains("secret"), "logged: {}", logs.text());
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn a_database_error_is_logged_once_with_the_identifier_of_its_request(pool: PgPool) {
    let (_guard, logs) = capture_logs();
    pool.close().await;
    let request = Request::get("/api/health").body(Body::empty()).unwrap();

    let answer = call(pool, request).await;

    assert_eq!(answer.status, StatusCode::SERVICE_UNAVAILABLE);
    let errors = logs.events_saying("database ping failed");
    assert_eq!(errors.len(), 1, "logged: {}", logs.text());
    assert_eq!(errors[0]["level"], "ERROR");
    assert!(errors[0]["error"].is_string());
    assert_eq!(errors[0]["span"]["request_id"], request_id(&answer));
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn a_server_error_is_logged_at_the_error_level(pool: PgPool) {
    let (_guard, logs) = capture_logs();
    pool.close().await;
    let request = Request::get("/api/health").body(Body::empty()).unwrap();

    call(pool, request).await;

    let events = logs.events_saying("request completed");
    assert_eq!(events.len(), 1, "logged: {}", logs.text());
    assert_eq!(events[0]["level"], "ERROR");
    assert_eq!(events[0]["status"], 503);
}
