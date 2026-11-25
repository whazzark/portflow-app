//! What the API logs for a request, and the identifier it gives to each one.

use std::io;
use std::sync::{Arc, Mutex, OnceLock};

use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use infrastructure::database::PgPool;
use serde_json::Value;

use crate::support::{Answer, call};

const REQUEST_ID: &str = "x-request-id";

/// Where the logs of the tests are written, instead of the standard output.
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
    /// Everything that was logged, by every test, as written.
    fn text(&self) -> String {
        String::from_utf8(self.0.lock().unwrap().clone()).unwrap()
    }

    /// The events logged while this request was handled that have this message: one
    /// JSON object per event.
    fn events_of(&self, request_id: &str, message: &str) -> Vec<Value> {
        self.text()
            .lines()
            .map(|line| serde_json::from_str::<Value>(line).unwrap())
            .filter(|event| event["span"]["request_id"] == request_id)
            .filter(|event| event["message"] == message)
            .collect()
    }
}

/// The logs of this test binary, in the JSON format of the API. The tests run in
/// parallel and `tracing` has one destination for the whole process, so they share
/// it: each test reads only the events of its own request, found by its identifier.
fn captured_logs() -> &'static Captured {
    static LOGS: OnceLock<Captured> = OnceLock::new();
    LOGS.get_or_init(|| {
        let captured = Captured::default();
        let writer = captured.clone();
        let subscriber = tracing_subscriber::fmt()
            .json()
            .flatten_event(true)
            .with_span_list(false)
            .with_writer(move || writer.clone())
            .finish();
        tracing::subscriber::set_global_default(subscriber).unwrap();
        captured
    })
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
    let logs = captured_logs();
    let request = Request::get("/api/health").body(Body::empty()).unwrap();

    let answer = call(pool, request).await;

    let events = logs.events_of(&request_id(&answer), "request completed");
    assert_eq!(events.len(), 1, "logged: {}", logs.text());
    let event = &events[0];
    assert_eq!(event["level"], "INFO");
    assert_eq!(event["status"], 200);
    assert!(event["duration_ms"].is_u64());
    assert_eq!(event["span"]["method"], "GET");
    assert_eq!(event["span"]["path"], "/api/health");
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn no_credential_cookie_query_or_body_is_logged(pool: PgPool) {
    let logs = captured_logs();
    let request = Request::get("/api/health?token=secret-in-the-query")
        .header(header::COOKIE, "session=secret-in-the-cookie")
        .header(header::AUTHORIZATION, "Bearer secret-in-the-credential")
        .header(REQUEST_ID, "secret-in-the-identifier")
        .body(Body::from("secret-in-the-body"))
        .unwrap();

    let answer = call(pool, request).await;

    assert_eq!(answer.status, StatusCode::OK);
    let events = logs.events_of(&request_id(&answer), "request completed");
    assert_eq!(events.len(), 1, "logged: {}", logs.text());
    assert_eq!(events[0]["span"]["path"], "/api/health");
    // Only this test sends these values: none may be anywhere in the logs.
    assert!(!logs.text().contains("secret"), "logged: {}", logs.text());
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn a_database_error_is_logged_once_with_the_identifier_of_its_request(pool: PgPool) {
    let logs = captured_logs();
    pool.close().await;
    let request = Request::get("/api/health").body(Body::empty()).unwrap();

    let answer = call(pool, request).await;

    assert_eq!(answer.status, StatusCode::SERVICE_UNAVAILABLE);
    let errors = logs.events_of(&request_id(&answer), "database ping failed");
    assert_eq!(errors.len(), 1, "logged: {}", logs.text());
    assert_eq!(errors[0]["level"], "ERROR");
    assert!(errors[0]["error"].is_string());
}

#[sqlx::test(migrator = "infrastructure::database::MIGRATOR")]
async fn a_server_error_is_logged_at_the_error_level(pool: PgPool) {
    let logs = captured_logs();
    pool.close().await;
    let request = Request::get("/api/health").body(Body::empty()).unwrap();

    let answer = call(pool, request).await;

    let events = logs.events_of(&request_id(&answer), "request completed");
    assert_eq!(events.len(), 1, "logged: {}", logs.text());
    assert_eq!(events[0]["level"], "ERROR");
    assert_eq!(events[0]["status"], 503);
}
