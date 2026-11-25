//! The one error body of the API: a problem (RFC 9457) with a stable `code` (ADR 0015).

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
    fn a_rejection_that_is_a_fault_of_the_server_is_an_internal_error() {
        let problem = Problem::rejected(StatusCode::INTERNAL_SERVER_ERROR, "Missing extension");
        let problem = serde_json::to_value(problem).unwrap();

        assert_eq!(problem["code"], "INTERNAL_ERROR");
        assert_eq!(problem["detail"], "The server could not handle the request");
    }
}
