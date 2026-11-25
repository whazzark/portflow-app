//! The extractors of the handlers. Each one wraps the extractor of Axum with the same
//! behaviour, except that a rejected body or parameter is answered as a problem
//! (ADR 0015) instead of the plain text of Axum.
//!
//! A handler takes `JsonBody`, `PathParams` and `QueryParams`, never `axum::Json`,
//! `axum::extract::Path` or `axum::extract::Query` as an argument.

#[cfg(test)]
mod tests {
    use axum::Router;
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use axum::routing::{get, post};
    use http_body_util::BodyExt;
    use serde::Deserialize;
    use serde_json::Value;
    use tower::ServiceExt;

    use super::*;
    use crate::problem::PROBLEM_CONTENT_TYPE;

    #[derive(Debug, Deserialize)]
    struct Truck {
        #[allow(dead_code)]
        plate: String,
    }

    #[derive(Debug, Deserialize)]
    struct Page {
        #[allow(dead_code)]
        page: u32,
    }

    async fn create_truck(JsonBody(_truck): JsonBody<Truck>) {}
    async fn get_truck(PathParams(_id): PathParams<u32>) {}
    async fn list_trucks(QueryParams(_page): QueryParams<Page>) {}

    /// A router with one route per extractor: the API has no such route yet.
    fn router() -> Router {
        Router::new()
            .route("/trucks", post(create_truck).get(list_trucks))
            .route("/trucks/{id}", get(get_truck))
    }

    /// Calls the router, checks that the answer is a problem, and returns it.
    async fn problem_of(request: Request<Body>) -> (StatusCode, Value) {
        let response = router().oneshot(request).await.unwrap();

        let status = response.status();
        assert_eq!(
            response.headers()[header::CONTENT_TYPE],
            PROBLEM_CONTENT_TYPE
        );
        let body = response.into_body().collect().await.unwrap().to_bytes();
        (status, serde_json::from_slice(&body).unwrap())
    }

    fn post_json(body: &'static str) -> Request<Body> {
        Request::post("/trucks")
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(body))
            .unwrap()
    }

    #[tokio::test]
    async fn a_body_that_is_not_json_is_a_problem() {
        let (status, problem) = problem_of(post_json("{not json")).await;

        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(problem["status"], 400);
        assert_eq!(problem["code"], "INVALID_REQUEST");
    }

    #[tokio::test]
    async fn a_body_with_a_missing_field_is_a_problem() {
        let (status, problem) = problem_of(post_json("{}")).await;

        assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
        assert_eq!(problem["code"], "INVALID_REQUEST");
    }

    #[tokio::test]
    async fn a_body_without_the_json_content_type_is_a_problem() {
        let request = Request::post("/trucks")
            .body(Body::from(r#"{"plate":"AB-123-CD"}"#))
            .unwrap();

        let (status, problem) = problem_of(request).await;

        assert_eq!(status, StatusCode::UNSUPPORTED_MEDIA_TYPE);
        assert_eq!(problem["code"], "INVALID_REQUEST");
    }

    #[tokio::test]
    async fn a_path_parameter_of_the_wrong_type_is_a_problem() {
        let request = Request::get("/trucks/abc").body(Body::empty()).unwrap();

        let (status, problem) = problem_of(request).await;

        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(problem["code"], "INVALID_REQUEST");
    }

    #[tokio::test]
    async fn a_missing_query_parameter_is_a_problem() {
        let request = Request::get("/trucks").body(Body::empty()).unwrap();

        let (status, problem) = problem_of(request).await;

        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(problem["code"], "INVALID_REQUEST");
    }

    #[tokio::test]
    async fn an_accepted_request_reaches_the_handler() {
        let response = router()
            .oneshot(post_json(r#"{"plate":"AB-123-CD"}"#))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}
