//! The one way an HTTP test calls the API. `call` sends the request to the whole
//! router and checks the answer against the OpenAPI document (ADR 0015): a test fails
//! when a route answers a status code that its operation does not declare, or an
//! error that is not a problem.

use api::problem::PROBLEM_CONTENT_TYPE;
use api::state::AppState;
use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use http_body_util::BodyExt;
use infrastructure::database::PgPool;
use serde_json::Value;
use tower::ServiceExt;

/// What the API answered: the status code and the JSON body (`Null` when empty).
pub struct Answer {
    pub status: StatusCode,
    pub body: Value,
}

/// Calls the whole router, as the binary serves it, and checks the answer against
/// the OpenAPI document.
pub async fn call(pool: PgPool, request: Request<Body>) -> Answer {
    let method = request.method().as_str().to_lowercase();
    let path = request.uri().path().to_owned();

    let response = api::router(AppState::new(pool))
        .oneshot(request)
        .await
        .unwrap();

    let status = response.status();
    let content_type = response
        .headers()
        .get(header::CONTENT_TYPE)
        .map(|value| value.to_str().unwrap().to_owned());
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap()
    };

    let document = serde_json::to_value(api::openapi::document()).unwrap();
    match declared_statuses(&document, &method, &path) {
        Some(declared) => assert!(
            declared.contains(&status.as_u16().to_string()),
            "{method} {path} answered {status}, which its operation does not declare \
             (declared: {declared:?}): add the response to its `#[utoipa::path]`"
        ),
        // No operation: only the answers of an unknown route or of a wrong method.
        None => assert!(
            status == StatusCode::NOT_FOUND || status == StatusCode::METHOD_NOT_ALLOWED,
            "{method} {path} is not in the OpenAPI document and answered {status}"
        ),
    }

    if status.is_client_error() || status.is_server_error() {
        assert_eq!(
            content_type.as_deref(),
            Some(PROBLEM_CONTENT_TYPE),
            "{method} {path} answered {status} with a body that is not a problem"
        );
        assert_eq!(body["status"], status.as_u16());
        for member in ["type", "title", "detail", "code"] {
            assert!(
                body[member].is_string(),
                "{method} {path} answered a problem without `{member}`"
            );
        }
    }

    Answer { status, body }
}

/// The status codes that the operation of this method and path declares, or `None`
/// when the document has no such operation.
fn declared_statuses(document: &Value, method: &str, path: &str) -> Option<Vec<String>> {
    let paths = document["paths"].as_object()?;
    let (_, item) = paths
        .iter()
        .find(|(template, _)| matches_template(template, path))?;
    let responses = item[method]["responses"].as_object()?;
    Some(responses.keys().cloned().collect())
}

/// Whether a path is an instance of a template of the document: `/api/trucks/12`
/// matches `/api/trucks/{id}`.
fn matches_template(template: &str, path: &str) -> bool {
    let template: Vec<&str> = template.split('/').collect();
    let path: Vec<&str> = path.split('/').collect();
    template.len() == path.len()
        && template.iter().zip(&path).all(|(expected, actual)| {
            (expected.starts_with('{') && expected.ends_with('}') && !actual.is_empty())
                || expected == actual
        })
}

#[test]
fn a_path_matches_its_template_segment_by_segment() {
    assert!(matches_template("/api/health", "/api/health"));
    assert!(matches_template("/api/trucks/{id}", "/api/trucks/12"));
    assert!(!matches_template("/api/trucks/{id}", "/api/trucks"));
    assert!(!matches_template(
        "/api/trucks/{id}",
        "/api/trucks/12/weighings"
    ));
    assert!(!matches_template("/api/health", "/api/nope"));
}

#[test]
fn the_declared_status_codes_are_those_of_the_operation() {
    let document = serde_json::json!({
        "paths": { "/api/trucks/{id}": { "get": { "responses": { "200": {}, "404": {} } } } }
    });

    assert_eq!(
        declared_statuses(&document, "get", "/api/trucks/12"),
        Some(vec!["200".to_owned(), "404".to_owned()])
    );
    assert_eq!(declared_statuses(&document, "post", "/api/trucks/12"), None);
    assert_eq!(declared_statuses(&document, "get", "/api/docks"), None);
}
