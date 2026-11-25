//! The OpenAPI document, generated from the annotations of the routes (ADR 0003).
//! `contracts/openapi.json` is its committed copy: `api openapi <file>` writes it.

use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Portflow API",
        description = "Bulk discharge management for the operating organization of a port site"
    ),
    paths(crate::health::get_health),
    tags((name = "health", description = "Health of the service"))
)]
struct ApiDoc;

/// The OpenAPI document of the API: the one source of `contracts/openapi.json` and of
/// the page of `/api/docs`. The tests read it to know what each operation declares.
pub fn document() -> utoipa::openapi::OpenApi {
    let mut document = ApiDoc::openapi();
    // utoipa copies the license of Cargo.toml, which the API does not declare.
    document.info.license = None;
    document
}

/// The OpenAPI document as committed in `contracts/openapi.json`.
pub fn to_json() -> Result<String, serde_json::Error> {
    let mut json = document().to_pretty_json()?;
    json.push('\n');
    Ok(json)
}

#[cfg(test)]
mod tests {
    use serde_json::{Value, json};

    use super::*;
    use crate::problem::PROBLEM_CONTENT_TYPE;

    const COMMITTED: &str = include_str!("../../../../../contracts/openapi.json");

    const METHODS: [&str; 8] = [
        "get", "put", "post", "delete", "patch", "head", "options", "trace",
    ];

    const PROBLEM_SCHEMA: &str = "#/components/schemas/Problem";

    #[test]
    fn the_committed_contract_matches_the_code() {
        assert!(
            to_json().unwrap() == COMMITTED,
            "contracts/openapi.json differs from the code: \
             run `pnpm --filter @portflow/api openapi` and commit the result"
        );
    }

    /// What the document declares against the rule of ADR 0015, one line per fault.
    fn violations(document: &Value) -> Vec<String> {
        let mut violations = Vec::new();
        let Some(paths) = document["paths"].as_object() else {
            return violations;
        };
        for (path, item) in paths {
            for method in METHODS {
                if let Some(responses) = item[method]["responses"].as_object() {
                    let operation = format!("{} {path}", method.to_uppercase());
                    check_operation(&operation, responses, &mut violations);
                }
            }
        }
        violations
    }

    fn check_operation(
        operation: &str,
        responses: &serde_json::Map<String, Value>,
        violations: &mut Vec<String>,
    ) {
        let mut has_success = false;
        for (status, response) in responses {
            if status.starts_with('2') {
                has_success = true;
                // 204 No Content is the only success without a body.
                if status != "204" && !has_a_schema(response) {
                    violations.push(format!("{operation}: the {status} has no schema"));
                }
            } else if status.starts_with('4') || status.starts_with('5') {
                if !is_a_problem(response) {
                    violations.push(format!(
                        "{operation}: the {status} is not `{PROBLEM_CONTENT_TYPE}` with the Problem schema"
                    ));
                } else if !has_an_example_of_its_problem(status, response) {
                    violations.push(format!(
                        "{operation}: the {status} has no example of the problem it answers"
                    ));
                }
            }
        }
        if !has_success {
            violations.push(format!("{operation}: no success response"));
        }
        if !responses.contains_key("500") {
            violations.push(format!(
                "{operation}: the internal error (500) is not declared"
            ));
        }
    }

    fn has_a_schema(response: &Value) -> bool {
        match response["content"].as_object() {
            Some(content) => {
                !content.is_empty() && content.values().all(|media| media["schema"].is_object())
            }
            None => false,
        }
    }

    fn is_a_problem(response: &Value) -> bool {
        match response["content"].as_object() {
            Some(content) => {
                content.len() == 1
                    && content
                        .get(PROBLEM_CONTENT_TYPE)
                        .is_some_and(|media| media["schema"]["$ref"] == PROBLEM_SCHEMA)
            }
            None => false,
        }
    }

    /// Whether the response shows the problem it answers: an example with its own
    /// status code and a `code`, not the values a tool invents from the schema.
    fn has_an_example_of_its_problem(status: &str, response: &Value) -> bool {
        let example = &response["content"][PROBLEM_CONTENT_TYPE]["example"];
        let shows_its_status = example["status"]
            .as_u64()
            .is_some_and(|value| Ok(value) == status.parse());
        shows_its_status && example["code"].is_string()
    }

    /// A document with one operation, `GET /trucks`, and the given responses.
    fn document_with(responses: Value) -> Value {
        json!({ "paths": { "/trucks": { "get": { "responses": responses } } } })
    }

    fn success() -> Value {
        json!({ "description": "ok", "content": { "application/json": { "schema": { "type": "object" } } } })
    }

    fn problem(status: u16) -> Value {
        let example = json!({ "status": status, "code": "SOME_CODE" });
        json!({ "description": "error", "content": { PROBLEM_CONTENT_TYPE: { "schema": { "$ref": PROBLEM_SCHEMA }, "example": example } } })
    }

    #[test]
    fn an_operation_that_follows_the_rule_has_no_violation() {
        let document =
            document_with(json!({ "200": success(), "404": problem(404), "500": problem(500) }));

        assert_eq!(violations(&document), Vec::<String>::new());
    }

    #[test]
    fn a_success_without_a_body_is_accepted_only_as_204() {
        let no_content = json!({ "description": "deleted" });

        let accepted = document_with(json!({ "204": no_content, "500": problem(500) }));
        let refused = document_with(json!({ "200": no_content, "500": problem(500) }));

        assert_eq!(violations(&accepted), Vec::<String>::new());
        assert_eq!(violations(&refused), ["GET /trucks: the 200 has no schema"]);
    }

    #[test]
    fn an_operation_without_a_success_response_is_a_violation() {
        let document = document_with(json!({ "500": problem(500) }));

        assert_eq!(violations(&document), ["GET /trucks: no success response"]);
    }

    #[test]
    fn an_error_that_does_not_use_the_problem_schema_is_a_violation() {
        let own_body = success();
        let document =
            document_with(json!({ "200": success(), "404": own_body, "500": problem(500) }));

        assert_eq!(
            violations(&document),
            ["GET /trucks: the 404 is not `application/problem+json` with the Problem schema"]
        );
    }

    #[test]
    fn an_error_without_an_example_of_its_problem_is_a_violation() {
        let no_example = json!({ "description": "error", "content": { PROBLEM_CONTENT_TYPE: { "schema": { "$ref": PROBLEM_SCHEMA } } } });
        let example_of_another_error = problem(500);

        let missing =
            document_with(json!({ "200": success(), "404": no_example, "500": problem(500) }));
        let wrong = document_with(
            json!({ "200": success(), "404": example_of_another_error, "500": problem(500) }),
        );

        let expected = ["GET /trucks: the 404 has no example of the problem it answers"];
        assert_eq!(violations(&missing), expected);
        assert_eq!(violations(&wrong), expected);
    }

    #[test]
    fn an_operation_that_does_not_declare_the_internal_error_is_a_violation() {
        let document = document_with(json!({ "200": success() }));

        assert_eq!(
            violations(&document),
            ["GET /trucks: the internal error (500) is not declared"]
        );
    }

    #[test]
    fn every_operation_of_the_api_documents_its_success_and_its_errors() {
        let document = serde_json::to_value(document()).unwrap();

        assert_eq!(violations(&document), Vec::<String>::new());
    }
}
