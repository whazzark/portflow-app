//! The one error body of the API: a problem (RFC 9457) with a stable `code` (ADR 0015).

use axum::Json;
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use serde::Serialize;
use utoipa::ToSchema;

/// The media type of a problem (RFC 9457).
pub const PROBLEM_CONTENT_TYPE: &str = "application/problem+json";

/// `type` of every problem: the errors are told apart by `code`, not by a page.
const ABOUT_BLANK: &str = "about:blank";

/// The only detail an internal error gives: never its cause.
const INTERNAL_DETAIL: &str = "The server could not handle the request";

/// The stable identifier of an error. The web app maps each value to a label:
/// a value is never renamed or removed without the two issues of a contract change.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, ToSchema)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProblemCode {
    /// No route matches the path.
    NotFound,
    /// The route exists, not with this method.
    MethodNotAllowed,
    /// The body or the parameters of the request were rejected.
    InvalidRequest,
    /// The database does not answer.
    DatabaseUnavailable,
    /// Anything the server did not expect.
    InternalError,
}

/// The body of every error response of the API.
#[derive(Debug, Serialize, ToSchema)]
pub struct Problem {
    /// Always `about:blank`: `code` identifies the error.
    #[serde(rename = "type")]
    problem_type: String,
    /// The reason phrase of the status code.
    title: String,
    /// The HTTP status code of the response.
    status: u16,
    /// An explanation in English for the developer, never shown to the user.
    detail: String,
    code: ProblemCode,
}

impl Problem {
    pub fn new(status: StatusCode, code: ProblemCode, detail: &str) -> Self {
        Self {
            problem_type: ABOUT_BLANK.to_owned(),
            title: status.canonical_reason().unwrap_or("Error").to_owned(),
            status: status.as_u16(),
            detail: detail.to_owned(),
            code,
        }
    }

    pub fn not_found() -> Self {
        Self::new(
            StatusCode::NOT_FOUND,
            ProblemCode::NotFound,
            "No route matches this path",
        )
    }

    pub fn method_not_allowed() -> Self {
        Self::new(
            StatusCode::METHOD_NOT_ALLOWED,
            ProblemCode::MethodNotAllowed,
            "This route does not accept this method",
        )
    }

    pub fn database_unavailable() -> Self {
        Self::new(
            StatusCode::SERVICE_UNAVAILABLE,
            ProblemCode::DatabaseUnavailable,
            "The database does not answer",
        )
    }

    /// An internal error. It takes no argument on purpose: the cause stays on the server.
    pub fn internal() -> Self {
        Self::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            ProblemCode::InternalError,
            INTERNAL_DETAIL,
        )
    }

    /// A body or parameters that an extractor of Axum rejected, with the status code
    /// Axum chose. A rejection that is a fault of the server is an internal error.
    pub fn rejected(status: StatusCode, detail: &str) -> Self {
        if status.is_client_error() {
            Self::new(status, ProblemCode::InvalidRequest, detail)
        } else {
            Self::internal()
        }
    }

    pub fn status(&self) -> StatusCode {
        StatusCode::from_u16(self.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

impl IntoResponse for Problem {
    fn into_response(self) -> Response {
        let mut response = (self.status(), Json(self)).into_response();
        response.headers_mut().insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static(PROBLEM_CONTENT_TYPE),
        );
        response
    }
}

#[cfg(test)]
mod tests {
    use axum::http::{StatusCode, header};
    use axum::response::IntoResponse;
    use http_body_util::BodyExt;
    use serde_json::{Value, json};

    use super::*;

    #[test]
    fn a_problem_has_the_members_of_the_rfc_and_its_code() {
        let problem = Problem::new(
            StatusCode::NOT_FOUND,
            ProblemCode::NotFound,
            "No route matches this path",
        );

        assert_eq!(
            serde_json::to_value(&problem).unwrap(),
            json!({
                "type": "about:blank",
                "title": "Not Found",
                "status": 404,
                "detail": "No route matches this path",
                "code": "NOT_FOUND"
            })
        );
    }

    #[tokio::test]
    async fn a_problem_answers_its_status_code_as_problem_json() {
        let response = Problem::database_unavailable().into_response();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(
            response.headers()[header::CONTENT_TYPE],
            PROBLEM_CONTENT_TYPE
        );
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(body["status"], 503);
        assert_eq!(body["code"], "DATABASE_UNAVAILABLE");
    }

    #[test]
    fn an_internal_error_reveals_no_detail_of_its_cause() {
        let problem = serde_json::to_value(Problem::internal()).unwrap();

        assert_eq!(problem["status"], 500);
        assert_eq!(problem["code"], "INTERNAL_ERROR");
        assert_eq!(problem["detail"], "The server could not handle the request");
    }

    #[test]
    fn a_rejected_request_keeps_the_status_code_of_axum() {
        let problem = Problem::rejected(StatusCode::UNPROCESSABLE_ENTITY, "missing field `name`");
        let problem = serde_json::to_value(problem).unwrap();

        assert_eq!(problem["status"], 422);
        assert_eq!(problem["code"], "INVALID_REQUEST");
        assert_eq!(problem["detail"], "missing field `name`");
    }

    #[test]
    fn a_problem_without_field_errors_has_no_errors_member() {
        let problem = serde_json::to_value(Problem::not_found()).unwrap();

        assert!(problem.get("errors").is_none());
    }

    #[test]
    fn a_failed_validation_names_each_refused_field_of_the_body() {
        let problem = Problem::validation_failed(vec![
            FieldError::new("/tonnage", FieldErrorCode::OutOfRange),
            FieldError::new("/vessel/name", FieldErrorCode::Required),
        ]);

        assert_eq!(problem.status(), StatusCode::UNPROCESSABLE_ENTITY);
        assert_eq!(
            serde_json::to_value(&problem).unwrap(),
            json!({
                "type": "about:blank",
                "title": "Unprocessable Entity",
                "status": 422,
                "detail": "Some fields of the request body are not valid",
                "code": "VALIDATION_FAILED",
                "errors": [
                    { "pointer": "/tonnage", "code": "OUT_OF_RANGE" },
                    { "pointer": "/vessel/name", "code": "REQUIRED" }
                ]
            })
        );
    }

    #[test]
    fn the_field_error_codes_are_written_in_upper_snake_case() {
        let codes = [
            FieldErrorCode::Required,
            FieldErrorCode::InvalidFormat,
            FieldErrorCode::OutOfRange,
            FieldErrorCode::TooLong,
        ]
        .map(|code| serde_json::to_value(code).unwrap());

        assert_eq!(
            codes,
            [
                json!("REQUIRED"),
                json!("INVALID_FORMAT"),
                json!("OUT_OF_RANGE"),
                json!("TOO_LONG")
            ]
        );
    }

    #[test]
    fn a_rejection_that_is_a_fault_of_the_server_is_an_internal_error() {
        let problem = Problem::rejected(StatusCode::INTERNAL_SERVER_ERROR, "Missing extension");
        let problem = serde_json::to_value(problem).unwrap();

        assert_eq!(problem["code"], "INTERNAL_ERROR");
        assert_eq!(problem["detail"], "The server could not handle the request");
    }
}
