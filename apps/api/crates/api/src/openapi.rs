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
/// the page of `/api/docs`.
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
    use super::*;

    const COMMITTED: &str = include_str!("../../../../../contracts/openapi.json");

    #[test]
    fn the_committed_contract_matches_the_code() {
        assert!(
            to_json().unwrap() == COMMITTED,
            "contracts/openapi.json differs from the code: \
             run `pnpm --filter @portflow/api openapi` and commit the result"
        );
    }
}
